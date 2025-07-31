-- Update analyze_missing_quiz_completions to use user_activity_log
CREATE OR REPLACE FUNCTION public.analyze_missing_quiz_completions()
 RETURNS TABLE(total_passed_quizzes bigint, missing_completion_records bigint, affected_users bigint, affected_courses bigint, sample_affected_users jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH quiz_passes AS (
    SELECT DISTINCT
      ual.user_id,
      ual.quiz_id,
      q.unit_id,
      ual.course_id,
      p.email,
      ROW_NUMBER() OVER (PARTITION BY ual.user_id, ual.quiz_id ORDER BY ual.created_at DESC) as rn
    FROM user_activity_log ual
    JOIN quizzes q ON ual.quiz_id = q.id
    JOIN profiles p ON ual.user_id = p.id
    WHERE ual.activity_type = 'quiz_complete'
      AND q.unit_id IS NOT NULL
      AND p.is_deleted = false
      AND ual.metadata->>'passed' = 'true'
  ),
  missing_completions AS (
    SELECT 
      qp.user_id,
      qp.quiz_id,
      qp.unit_id,
      qp.course_id,
      qp.email
    FROM quiz_passes qp
    WHERE qp.rn = 1
      AND NOT EXISTS (
        SELECT 1 FROM user_unit_progress uup
        WHERE uup.user_id = qp.user_id
          AND uup.unit_id = qp.unit_id
          AND uup.course_id = qp.course_id
          AND uup.quiz_completed = true
      )
  ),
  stats AS (
    SELECT 
      (SELECT COUNT(*) FROM quiz_passes WHERE rn = 1) as total_passed,
      (SELECT COUNT(*) FROM missing_completions) as missing_records,
      (SELECT COUNT(DISTINCT user_id) FROM missing_completions) as affected_users_count,
      (SELECT COUNT(DISTINCT course_id) FROM missing_completions) as affected_courses_count,
      (SELECT jsonb_agg(DISTINCT email ORDER BY email) FROM missing_completions LIMIT 10) as sample_users
    FROM missing_completions
  )
  SELECT 
    s.total_passed,
    s.missing_records,
    s.affected_users_count,
    s.affected_courses_count,
    s.sample_users
  FROM stats s;
END;
$function$;

-- Update fix_missing_quiz_completions to use user_activity_log
CREATE OR REPLACE FUNCTION public.fix_missing_quiz_completions()
 RETURNS TABLE(users_affected integer, records_created integer, courses_updated integer, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_users_affected INTEGER := 0;
  v_records_created INTEGER := 0;
  v_courses_updated INTEGER := 0;
  v_affected_users TEXT[] := '{}';
  v_audit_id UUID;
  rec RECORD;
  v_unit_data RECORD;
BEGIN
  -- Create audit entry
  INSERT INTO public.user_management_audit (
    target_user_id,
    action_type,
    performed_by,
    reason,
    old_data
  ) VALUES (
    auth.uid(),
    'mass_quiz_completion_recovery',
    auth.uid(),
    'System-wide fix for missing quiz completion records using activity log',
    jsonb_build_object('operation', 'start', 'timestamp', now())
  ) RETURNING id INTO v_audit_id;

  -- Find users who have passed quizzes but don't have corresponding unit progress records
  FOR rec IN 
    WITH quiz_passes AS (
      SELECT DISTINCT
        ual.user_id,
        ual.quiz_id,
        q.unit_id,
        ual.course_id,
        ual.metadata->>'score' as score,
        ual.created_at as attempt_date,
        p.email,
        ROW_NUMBER() OVER (PARTITION BY ual.user_id, ual.quiz_id ORDER BY ual.created_at DESC) as rn
      FROM user_activity_log ual
      JOIN quizzes q ON ual.quiz_id = q.id
      JOIN profiles p ON ual.user_id = p.id
      WHERE ual.activity_type = 'quiz_complete'
        AND ual.metadata->>'passed' = 'true'
        AND q.unit_id IS NOT NULL
        AND p.is_deleted = false
    ),
    missing_completions AS (
      SELECT 
        qp.user_id,
        qp.quiz_id,
        qp.unit_id,
        qp.course_id,
        qp.score,
        qp.attempt_date,
        qp.email
      FROM quiz_passes qp
      WHERE qp.rn = 1  -- Only the most recent attempt per user per quiz
        AND NOT EXISTS (
          SELECT 1 FROM user_unit_progress uup
          WHERE uup.user_id = qp.user_id
            AND uup.unit_id = qp.unit_id
            AND uup.course_id = qp.course_id
            AND uup.quiz_completed = true
        )
    )
    SELECT * FROM missing_completions
    ORDER BY email, attempt_date
  LOOP
    BEGIN
      -- Get unit information
      SELECT * INTO v_unit_data
      FROM units
      WHERE id = rec.unit_id;
      
      IF NOT FOUND THEN
        CONTINUE; -- Skip if unit doesn't exist
      END IF;
      
      -- Create or update user_unit_progress record
      INSERT INTO public.user_unit_progress (
        user_id,
        unit_id,
        course_id,
        quiz_completed,
        quiz_completed_at,
        completed,
        completed_at,
        completion_method,
        created_at,
        updated_at
      ) VALUES (
        rec.user_id,
        rec.unit_id,
        rec.course_id,
        true,
        rec.attempt_date,
        true, -- Mark unit as complete since quiz was passed
        rec.attempt_date,
        'quiz_completion_recovery_activity_log',
        rec.attempt_date,
        now()
      )
      ON CONFLICT (user_id, unit_id, course_id) DO UPDATE SET
        quiz_completed = true,
        quiz_completed_at = COALESCE(user_unit_progress.quiz_completed_at, rec.attempt_date),
        completed = true,
        completed_at = COALESCE(user_unit_progress.completed_at, rec.attempt_date),
        completion_method = CASE 
          WHEN user_unit_progress.completion_method IS NULL 
          THEN 'quiz_completion_recovery_activity_log'
          ELSE user_unit_progress.completion_method
        END,
        updated_at = now();
      
      -- Track affected user
      IF NOT (rec.email = ANY(v_affected_users)) THEN
        v_affected_users := array_append(v_affected_users, rec.email);
        v_users_affected := v_users_affected + 1;
      END IF;
      
      v_records_created := v_records_created + 1;
      
      -- Update course progress for this user
      PERFORM public.update_course_progress_reliable(rec.user_id, rec.course_id);
      v_courses_updated := v_courses_updated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing
      INSERT INTO public.user_management_audit (
        target_user_id,
        action_type,
        performed_by,
        reason,
        old_data
      ) VALUES (
        rec.user_id,
        'quiz_completion_recovery_error',
        auth.uid(),
        'Error during mass recovery: ' || SQLERRM,
        jsonb_build_object(
          'user_email', rec.email,
          'unit_id', rec.unit_id,
          'quiz_id', rec.quiz_id,
          'error', SQLERRM
        )
      );
      CONTINUE;
    END;
  END LOOP;
  
  -- Update audit record with results
  UPDATE public.user_management_audit
  SET new_data = jsonb_build_object(
    'users_affected', v_users_affected,
    'records_created', v_records_created,
    'courses_updated', v_courses_updated,
    'affected_users', v_affected_users,
    'completed_at', now()
  )
  WHERE id = v_audit_id;
  
  -- Return summary
  RETURN QUERY SELECT 
    v_users_affected,
    v_records_created, 
    v_courses_updated,
    jsonb_build_object(
      'affected_users', v_affected_users,
      'audit_id', v_audit_id,
      'operation', 'mass_quiz_completion_recovery_activity_log'
    );
END;
$function$;