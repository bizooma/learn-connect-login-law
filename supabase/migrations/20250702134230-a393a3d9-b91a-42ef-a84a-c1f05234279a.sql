-- Phase 2: Safe Database Functions with Backwards Compatibility
-- These functions will work alongside existing systems without breaking them

-- Function to safely update course progress without breaking existing logic
CREATE OR REPLACE FUNCTION public.update_course_progress_reliable(
  p_user_id UUID,
  p_course_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_units INTEGER;
  v_completed_units INTEGER;
  v_progress_percentage INTEGER;
  v_status TEXT;
  v_old_progress RECORD;
BEGIN
  -- Get current progress for backup
  SELECT * INTO v_old_progress 
  FROM user_course_progress 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Calculate accurate progress
  SELECT COUNT(DISTINCT u.id) INTO v_total_units
  FROM units u
  JOIN lessons l ON u.section_id = l.id
  WHERE l.course_id = p_course_id;
  
  SELECT COUNT(DISTINCT uup.unit_id) INTO v_completed_units
  FROM user_unit_progress uup
  JOIN units u ON uup.unit_id = u.id
  JOIN lessons l ON u.section_id = l.id
  WHERE uup.user_id = p_user_id 
    AND l.course_id = p_course_id
    AND uup.completed = true;
  
  -- Calculate new progress
  IF v_total_units > 0 THEN
    v_progress_percentage := ROUND((v_completed_units * 100.0) / v_total_units);
  ELSE
    v_progress_percentage := 0;
  END IF;
  
  -- Determine status
  IF v_progress_percentage >= 100 THEN
    v_status := 'completed';
  ELSIF v_progress_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;
  
  -- Safely update course progress (preserve existing data)
  INSERT INTO user_course_progress (
    user_id, course_id, progress_percentage, status, 
    started_at, completed_at, last_accessed_at
  ) VALUES (
    p_user_id, p_course_id, v_progress_percentage, v_status,
    COALESCE(v_old_progress.started_at, now()),
    CASE WHEN v_status = 'completed' THEN COALESCE(v_old_progress.completed_at, now()) ELSE v_old_progress.completed_at END,
    now()
  )
  ON CONFLICT (user_id, course_id) DO UPDATE SET
    progress_percentage = EXCLUDED.progress_percentage,
    status = EXCLUDED.status,
    completed_at = CASE 
      WHEN EXCLUDED.status = 'completed' AND user_course_progress.completed_at IS NULL 
      THEN now() 
      ELSE user_course_progress.completed_at 
    END,
    last_accessed_at = EXCLUDED.last_accessed_at,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'progress_percentage', v_progress_percentage,
    'status', v_status,
    'total_units', v_total_units,
    'completed_units', v_completed_units
  );
END;
$$;

-- Safe video completion sync that preserves existing data
CREATE OR REPLACE FUNCTION public.sync_video_completion_safe(
  p_user_id UUID,
  p_unit_id UUID,
  p_course_id UUID,
  p_watch_percentage INTEGER DEFAULT 100
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_video_progress RECORD;
  v_existing_unit_progress RECORD;
BEGIN
  -- Get existing data to preserve it
  SELECT * INTO v_existing_video_progress
  FROM user_video_progress 
  WHERE user_id = p_user_id AND unit_id = p_unit_id AND course_id = p_course_id;
  
  SELECT * INTO v_existing_unit_progress
  FROM user_unit_progress 
  WHERE user_id = p_user_id AND unit_id = p_unit_id AND course_id = p_course_id;
  
  -- Update video progress (preserve existing data)
  INSERT INTO user_video_progress (
    user_id, unit_id, course_id, watch_percentage, 
    is_completed, completed_at, last_watched_at,
    watched_duration_seconds, total_duration_seconds
  ) VALUES (
    p_user_id, p_unit_id, p_course_id, 
    GREATEST(COALESCE(v_existing_video_progress.watch_percentage, 0), p_watch_percentage),
    true, 
    COALESCE(v_existing_video_progress.completed_at, now()),
    now(),
    COALESCE(v_existing_video_progress.watched_duration_seconds, 0),
    v_existing_video_progress.total_duration_seconds
  )
  ON CONFLICT (user_id, unit_id, course_id) DO UPDATE SET
    watch_percentage = GREATEST(user_video_progress.watch_percentage, EXCLUDED.watch_percentage),
    is_completed = true,
    completed_at = COALESCE(user_video_progress.completed_at, EXCLUDED.completed_at),
    last_watched_at = EXCLUDED.last_watched_at,
    updated_at = now();
  
  -- Update unit progress (preserve existing data)
  INSERT INTO user_unit_progress (
    user_id, unit_id, course_id, video_completed, 
    video_completed_at, completed, completed_at, completion_method
  ) VALUES (
    p_user_id, p_unit_id, p_course_id, true,
    COALESCE(v_existing_unit_progress.video_completed_at, now()),
    COALESCE(v_existing_unit_progress.completed, false),
    v_existing_unit_progress.completed_at,
    COALESCE(v_existing_unit_progress.completion_method, 'video_watch')
  )
  ON CONFLICT (user_id, unit_id, course_id) DO UPDATE SET
    video_completed = true,
    video_completed_at = COALESCE(user_unit_progress.video_completed_at, EXCLUDED.video_completed_at),
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_course_progress_reliable(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_video_completion_safe(UUID, UUID, UUID, INTEGER) TO authenticated;