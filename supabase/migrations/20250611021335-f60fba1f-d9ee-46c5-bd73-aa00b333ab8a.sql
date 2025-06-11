
-- Function to efficiently recalculate course progress for users who have completed units but show 0%
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
      GROUP BY 
        ucp.user_id, ucp.course_id, ucp.progress_percentage, p.email
      HAVING 
        ucp.progress_percentage = 0 AND COUNT(DISTINCT uup.unit_id) > 0
    )
    SELECT * FROM inconsistent_records
  LOOP
    BEGIN
      -- Get total units count for this course
      SELECT COUNT(DISTINCT u.id) INTO v_total_units
      FROM units u
      JOIN lessons l ON u.section_id = l.id
      WHERE l.course_id = rec.course_id;
      
      -- Skip if there are no units (avoid division by zero)
      CONTINUE WHEN v_total_units = 0;
      
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
      
      -- Record affected user and course
      v_affected_users := array_append(v_affected_users, rec.email);
      v_affected_courses := array_append(v_affected_courses, rec.course_id::TEXT);
      v_courses_updated := v_courses_updated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log any errors
      v_errors := array_append(v_errors, 'Error updating ' || rec.email || ' course ' || rec.course_id || ': ' || SQLERRM);
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
    'completed_at', now()
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
      'audit_id', v_audit_id
    );
END;
$$;

-- Secure function that can only be executed by admins
CREATE OR REPLACE FUNCTION public.admin_recalculate_all_progress(p_reason TEXT DEFAULT 'Administrative bulk progress recalculation')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can perform bulk progress recalculation';
  END IF;

  -- Call the bulk recalculation function
  SELECT * INTO v_result FROM public.bulk_recalculate_course_progress(p_reason);
  
  -- Return results as JSON
  RETURN jsonb_build_object(
    'success', true,
    'courses_updated', v_result.courses_updated,
    'users_affected', v_result.users_affected,
    'details', v_result.details
  );
END;
$$;
