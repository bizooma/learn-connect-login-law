
-- Improved bulk progress recalculation function with better error handling
CREATE OR REPLACE FUNCTION public.bulk_recalculate_course_progress(
  p_audit_reason TEXT DEFAULT 'Bulk progress recalculation'
)
RETURNS TABLE(
  courses_updated INTEGER,
  users_affected INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_audit_id UUID;
  v_courses_updated INTEGER := 0;
  v_users_affected INTEGER := 0;
  v_affected_users TEXT[];
  v_affected_courses TEXT[];
  v_errors TEXT[];
  v_total_units INTEGER;
  v_new_percentage INTEGER;
  v_new_status TEXT;
  v_completed_at TIMESTAMP WITH TIME ZONE;
  rec RECORD;
  v_debug_info TEXT;
BEGIN
  -- Create audit entry for this bulk operation
  INSERT INTO public.user_management_audit (
    target_user_id,
    action_type,
    performed_by,
    reason,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    'bulk_progress_recalculation',
    auth.uid(),
    p_audit_reason,
    jsonb_build_object('operation', 'start', 'timestamp', now()),
    NULL
  ) RETURNING id INTO v_audit_id;
  
  -- Debug: Log the start of the operation
  v_debug_info := 'Starting bulk recalculation with audit_id: ' || v_audit_id::TEXT;
  
  -- Find users with potential progress inconsistencies
  FOR rec IN 
    WITH inconsistent_records AS (
      SELECT 
        ucp.user_id,
        ucp.course_id,
        ucp.progress_percentage,
        COUNT(DISTINCT uup.unit_id) AS actual_completed_units,
        p.email
      FROM 
        public.user_course_progress ucp
      JOIN 
        public.user_unit_progress uup ON ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
      JOIN
        public.profiles p ON ucp.user_id = p.id
      WHERE 
        uup.completed = true
        AND p.is_deleted = false  -- Only include active users
      GROUP BY 
        ucp.user_id, ucp.course_id, ucp.progress_percentage, p.email
      HAVING 
        ucp.progress_percentage = 0 AND COUNT(DISTINCT uup.unit_id) > 0
    )
    SELECT * FROM inconsistent_records
    LIMIT 100  -- Process in batches to avoid timeouts
  LOOP
    BEGIN
      -- Get total units count for this course
      SELECT COUNT(DISTINCT u.id) INTO v_total_units
      FROM public.units u
      JOIN public.lessons l ON u.section_id = l.id
      WHERE l.course_id = rec.course_id;
      
      -- Skip if there are no units (avoid division by zero)
      IF v_total_units = 0 THEN
        v_errors := array_append(v_errors, 'Course ' || rec.course_id || ' has no units');
        CONTINUE;
      END IF;
      
      -- Calculate new percentage and status
      v_new_percentage := LEAST(100, (rec.actual_completed_units * 100) / v_total_units);
      v_new_status := CASE
        WHEN v_new_percentage = 100 THEN 'completed'
        WHEN v_new_percentage > 0 THEN 'in_progress'
        ELSE 'not_started'
      END;
      v_completed_at := CASE
        WHEN v_new_percentage = 100 THEN now()
        ELSE NULL
      END;
      
      -- Save backup of current progress record
      INSERT INTO public.user_management_audit (
        target_user_id,
        action_type,
        performed_by,
        reason,
        old_data
      ) VALUES (
        rec.user_id,
        'course_progress_backup',
        auth.uid(),
        'Backup before bulk recalculation',
        (SELECT row_to_json(ucp) FROM public.user_course_progress ucp 
         WHERE ucp.user_id = rec.user_id AND ucp.course_id = rec.course_id)
      );
      
      -- Update the course progress
      UPDATE public.user_course_progress
      SET 
        progress_percentage = v_new_percentage,
        status = v_new_status,
        updated_at = now(),
        completed_at = COALESCE(v_completed_at, completed_at)
      WHERE 
        user_id = rec.user_id AND 
        course_id = rec.course_id;
      
      -- Check if update was successful
      IF FOUND THEN
        -- Record affected user and course
        v_affected_users := array_append(v_affected_users, rec.email);
        v_affected_courses := array_append(v_affected_courses, rec.course_id::TEXT);
        v_courses_updated := v_courses_updated + 1;
      ELSE
        v_errors := array_append(v_errors, 'Failed to update progress for user ' || rec.email || ' in course ' || rec.course_id);
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log any errors with more detail
      v_errors := array_append(v_errors, 'Error updating ' || rec.email || ' course ' || rec.course_id || ': ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')');
      CONTINUE;
    END;
  END LOOP;
  
  -- Count unique affected users
  v_users_affected := (SELECT COUNT(DISTINCT unnest) FROM unnest(v_affected_users));
  
  -- Update audit record with results
  UPDATE public.user_management_audit
  SET new_data = jsonb_build_object(
    'courses_updated', v_courses_updated,
    'users_affected', v_users_affected,
    'errors', v_errors,
    'completed_at', now(),
    'debug_info', v_debug_info
  )
  WHERE id = v_audit_id;
  
  -- Return summary statistics
  RETURN QUERY SELECT 
    v_courses_updated, 
    v_users_affected,
    jsonb_build_object(
      'affected_users', v_affected_users,
      'affected_courses', v_affected_courses,
      'errors', v_errors,
      'audit_id', v_audit_id,
      'debug_info', v_debug_info
    );
END;
$$;

-- Also create a diagnostic function to help understand the data
CREATE OR REPLACE FUNCTION public.diagnose_progress_inconsistencies()
RETURNS TABLE(
  total_users_with_progress INTEGER,
  users_with_zero_progress INTEGER,
  users_with_completed_units_but_zero_progress INTEGER,
  sample_inconsistent_records JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_users INTEGER;
  v_zero_progress INTEGER;
  v_inconsistent INTEGER;
  v_sample JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can run diagnostics';
  END IF;

  -- Count total users with course progress
  SELECT COUNT(*) INTO v_total_users
  FROM public.user_course_progress ucp
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE p.is_deleted = false;
  
  -- Count users with zero progress
  SELECT COUNT(*) INTO v_zero_progress
  FROM public.user_course_progress ucp
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE ucp.progress_percentage = 0 AND p.is_deleted = false;
  
  -- Count users with completed units but zero progress
  SELECT COUNT(DISTINCT ucp.user_id) INTO v_inconsistent
  FROM public.user_course_progress ucp
  JOIN public.user_unit_progress uup ON ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE ucp.progress_percentage = 0 
    AND uup.completed = true 
    AND p.is_deleted = false;
  
  -- Get sample of inconsistent records
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_email', p.email,
      'course_id', ucp.course_id,
      'progress_percentage', ucp.progress_percentage,
      'completed_units', completed_units_count
    )
  ) INTO v_sample
  FROM (
    SELECT 
      ucp.user_id,
      ucp.course_id,
      ucp.progress_percentage,
      p.email,
      COUNT(DISTINCT uup.unit_id) as completed_units_count
    FROM public.user_course_progress ucp
    JOIN public.user_unit_progress uup ON ucp.user_id = uup.user_id AND ucp.course_id = uup.course_id
    JOIN public.profiles p ON ucp.user_id = p.id
    WHERE ucp.progress_percentage = 0 
      AND uup.completed = true 
      AND p.is_deleted = false
    GROUP BY ucp.user_id, ucp.course_id, ucp.progress_percentage, p.email
    LIMIT 5
  ) sample_data;
  
  RETURN QUERY SELECT 
    v_total_users,
    v_zero_progress,
    v_inconsistent,
    v_sample;
END;
$$;
