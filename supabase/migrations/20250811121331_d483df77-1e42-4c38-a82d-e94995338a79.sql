-- 1) Uniqueness constraints for stability
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_unit_progress_unique
ON public.user_unit_progress(user_id, unit_id, course_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_video_progress_unique
ON public.user_video_progress(user_id, unit_id, course_id);

-- 2) Ensure trigger exists to keep course progress synced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_unit_progress_change'
  ) THEN
    CREATE TRIGGER trg_user_unit_progress_change
    AFTER INSERT OR UPDATE ON public.user_unit_progress
    FOR EACH ROW EXECUTE FUNCTION public.on_user_unit_progress_change();
  END IF;
END $$;

-- 3) Reliable RPC: Sync video completion safely
CREATE OR REPLACE FUNCTION public.sync_video_completion_safe(
  p_unit_id uuid,
  p_course_id uuid,
  p_watch_percentage integer DEFAULT 100,
  p_total_duration_seconds integer DEFAULT NULL,
  p_watched_duration_seconds integer DEFAULT NULL,
  p_force_complete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_completed boolean := p_force_complete OR COALESCE(p_watch_percentage, 0) >= 95;
  v_now timestamptz := now();
  v_old_video record;
  v_old_unit record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Upsert into user_video_progress with safest values
  SELECT * INTO v_old_video
  FROM public.user_video_progress
  WHERE user_id = v_user_id AND unit_id = p_unit_id AND course_id = p_course_id;

  INSERT INTO public.user_video_progress (
    user_id, unit_id, course_id,
    watch_percentage, is_completed, completed_at,
    last_watched_at, total_duration_seconds, watched_duration_seconds
  ) VALUES (
    v_user_id, p_unit_id, p_course_id,
    LEAST(100, GREATEST(COALESCE(p_watch_percentage, 0), COALESCE(v_old_video.watch_percentage, 0))),
    (COALESCE(v_old_video.is_completed, false) OR v_completed),
    CASE
      WHEN (COALESCE(v_old_video.is_completed, false) OR v_completed)
      THEN COALESCE(v_old_video.completed_at, v_now)
      ELSE NULL
    END,
    v_now,
    COALESCE(p_total_duration_seconds, v_old_video.total_duration_seconds),
    GREATEST(COALESCE(p_watched_duration_seconds, 0), COALESCE(v_old_video.watched_duration_seconds, 0))
  )
  ON CONFLICT (user_id, unit_id, course_id)
  DO UPDATE SET
    watch_percentage = LEAST(100, GREATEST(EXCLUDED.watch_percentage, user_video_progress.watch_percentage)),
    is_completed = user_video_progress.is_completed OR EXCLUDED.is_completed,
    completed_at = CASE
      WHEN (user_video_progress.is_completed OR EXCLUDED.is_completed)
      THEN COALESCE(user_video_progress.completed_at, EXCLUDED.completed_at)
      ELSE NULL
    END,
    last_watched_at = EXCLUDED.last_watched_at,
    total_duration_seconds = COALESCE(EXCLUDED.total_duration_seconds, user_video_progress.total_duration_seconds),
    watched_duration_seconds = GREATEST(EXCLUDED.watched_duration_seconds, user_video_progress.watched_duration_seconds),
    updated_at = v_now;

  -- Update user_unit_progress flags for video
  SELECT * INTO v_old_unit
  FROM public.user_unit_progress
  WHERE user_id = v_user_id AND unit_id = p_unit_id AND course_id = p_course_id;

  INSERT INTO public.user_unit_progress (
    user_id, unit_id, course_id,
    video_completed, video_completed_at,
    completed, completed_at, completion_method, updated_at
  ) VALUES (
    v_user_id, p_unit_id, p_course_id,
    true, v_now,
    (COALESCE(v_old_unit.completed, false) OR v_completed OR COALESCE(v_old_unit.quiz_completed, false)),
    CASE
      WHEN (COALESCE(v_old_unit.completed, false) OR v_completed OR COALESCE(v_old_unit.quiz_completed, false))
      THEN COALESCE(v_old_unit.completed_at, v_now)
      ELSE NULL
    END,
    COALESCE(v_old_unit.completion_method, CASE WHEN v_completed THEN 'video_auto' ELSE NULL END),
    v_now
  )
  ON CONFLICT (user_id, unit_id, course_id)
  DO UPDATE SET
    video_completed = true,
    video_completed_at = COALESCE(user_unit_progress.video_completed_at, EXCLUDED.video_completed_at),
    completed = user_unit_progress.completed OR v_completed OR COALESCE(user_unit_progress.quiz_completed, false),
    completed_at = CASE
      WHEN (user_unit_progress.completed OR v_completed OR COALESCE(user_unit_progress.quiz_completed, false))
      THEN COALESCE(user_unit_progress.completed_at, EXCLUDED.completed_at)
      ELSE NULL
    END,
    completion_method = COALESCE(user_unit_progress.completion_method, CASE WHEN v_completed THEN 'video_auto' ELSE NULL END),
    updated_at = v_now;

  -- Opportunistically recalc course and streak (trigger will also handle)
  PERFORM public.update_course_progress_reliable(v_user_id, p_course_id);
  PERFORM public.update_learning_streak(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Video progress synced safely',
    'completed', v_completed
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 4) Reliable RPC: Mark unit complete safely
CREATE OR REPLACE FUNCTION public.mark_unit_complete_reliable(
  p_unit_id uuid,
  p_course_id uuid,
  p_completion_method text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_unit_progress (
    user_id, unit_id, course_id,
    completed, completed_at, completion_method, updated_at
  ) VALUES (
    v_user_id, p_unit_id, p_course_id,
    true, v_now, p_completion_method, v_now
  )
  ON CONFLICT (user_id, unit_id, course_id)
  DO UPDATE SET
    completed = true,
    completed_at = COALESCE(user_unit_progress.completed_at, EXCLUDED.completed_at),
    completion_method = COALESCE(user_unit_progress.completion_method, EXCLUDED.completion_method),
    updated_at = v_now;

  PERFORM public.update_course_progress_reliable(v_user_id, p_course_id);
  PERFORM public.update_learning_streak(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Unit marked as completed safely'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 5) Reliable RPC: Mark quiz complete safely
CREATE OR REPLACE FUNCTION public.mark_quiz_complete_reliable(
  p_unit_id uuid,
  p_course_id uuid,
  p_score integer DEFAULT NULL,
  p_passed boolean DEFAULT true,
  p_quiz_completed_at timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_should_complete boolean := COALESCE(p_passed, true);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_unit_progress (
    user_id, unit_id, course_id,
    quiz_completed, quiz_completed_at,
    completed, completed_at,
    completion_method, updated_at
  ) VALUES (
    v_user_id, p_unit_id, p_course_id,
    true, COALESCE(p_quiz_completed_at, v_now),
    v_should_complete, CASE WHEN v_should_complete THEN COALESCE(p_quiz_completed_at, v_now) ELSE NULL END,
    CASE WHEN v_should_complete THEN 'quiz_pass' ELSE NULL END, v_now
  )
  ON CONFLICT (user_id, unit_id, course_id)
  DO UPDATE SET
    quiz_completed = true,
    quiz_completed_at = COALESCE(user_unit_progress.quiz_completed_at, EXCLUDED.quiz_completed_at),
    completed = user_unit_progress.completed OR v_should_complete,
    completed_at = CASE
      WHEN (user_unit_progress.completed OR v_should_complete)
      THEN COALESCE(user_unit_progress.completed_at, EXCLUDED.completed_at)
      ELSE NULL
    END,
    completion_method = COALESCE(user_unit_progress.completion_method, CASE WHEN v_should_complete THEN 'quiz_pass' ELSE NULL END),
    updated_at = v_now;

  -- Optionally log quiz activity for analytics
  INSERT INTO public.user_activity_log (
    user_id, activity_type, course_id, unit_id, quiz_id, duration_seconds, metadata, ip_address, session_id, user_agent
  ) VALUES (
    v_user_id, 'quiz_complete', p_course_id, p_unit_id, NULL, NULL,
    jsonb_build_object('score', p_score, 'passed', v_should_complete), NULL, NULL, NULL
  );

  PERFORM public.update_course_progress_reliable(v_user_id, p_course_id);
  PERFORM public.update_learning_streak(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Quiz completion recorded safely',
    'passed', v_should_complete
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;