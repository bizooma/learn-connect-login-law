-- Enhanced bulk progress recalculation to fix ALL inconsistencies
CREATE OR REPLACE FUNCTION public.bulk_recalculate_course_progress(p_audit_reason text DEFAULT 'Comprehensive progress recalculation'::text)
RETURNS TABLE(courses_updated integer, users_affected integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
    'comprehensive_progress_recalculation',
    auth.uid(),
    p_audit_reason,
    jsonb_build_object('operation', 'start', 'timestamp', now()),
    NULL
  ) RETURNING id INTO v_audit_id;
  
  v_debug_info := 'Starting comprehensive recalculation with audit_id: ' || v_audit_id::TEXT;
  
  -- Find ALL users with progress inconsistencies by comparing stored vs calculated progress
  FOR rec IN 
    WITH user_course_calculations AS (
      SELECT 
        ucp.user_id,
        ucp.course_id,
        ucp.progress_percentage as stored_percentage,
        ucp.status as stored_status,
        p.email,
        -- Calculate actual progress based on completed units
        COUNT(DISTINCT u.id) as total_units_in_course,
        COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) as actual_completed_units,
        CASE 
          WHEN COUNT(DISTINCT u.id) > 0 THEN 
            LEAST(100, (COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) * 100) / COUNT(DISTINCT u.id))
          ELSE 0 
        END as calculated_percentage,
        CASE 
          WHEN COUNT(DISTINCT u.id) > 0 AND 
               (COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) * 100) / COUNT(DISTINCT u.id) = 100 
          THEN 'completed'
          WHEN COUNT(DISTINCT CASE WHEN uup.completed = true THEN uup.unit_id END) > 0 
          THEN 'in_progress'
          ELSE 'not_started'
        END as calculated_status
      FROM 
        public.user_course_progress ucp
      JOIN 
        public.profiles p ON ucp.user_id = p.id
      JOIN 
        public.units u ON EXISTS (
          SELECT 1 FROM public.lessons l 
          WHERE l.id = u.section_id AND l.course_id = ucp.course_id
        )
      LEFT JOIN 
        public.user_unit_progress uup ON ucp.user_id = uup.user_id 
        AND ucp.course_id = uup.course_id 
        AND uup.unit_id = u.id
      WHERE 
        p.is_deleted = false  -- Only include active users
      GROUP BY 
        ucp.user_id, ucp.course_id, ucp.progress_percentage, ucp.status, p.email
    )
    SELECT 
      user_id,
      course_id,
      stored_percentage,
      stored_status,
      email,
      total_units_in_course,
      actual_completed_units,
      calculated_percentage,
      calculated_status
    FROM user_course_calculations
    WHERE 
      -- Find ANY mismatch between stored and calculated values
      (stored_percentage != calculated_percentage OR stored_status != calculated_status)
      AND total_units_in_course > 0  -- Only courses with actual units
    ORDER BY email, course_id
  LOOP
    BEGIN
      -- Skip if there are no units (avoid division by zero)
      IF rec.total_units_in_course = 0 THEN
        v_errors := array_append(v_errors, 'Course ' || rec.course_id || ' has no units');
        CONTINUE;
      END IF;
      
      -- Use calculated values
      v_new_percentage := rec.calculated_percentage;
      v_new_status := rec.calculated_status;
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
        'Backup before comprehensive recalculation',
        jsonb_build_object(
          'course_id', rec.course_id,
          'old_percentage', rec.stored_percentage,
          'old_status', rec.stored_status,
          'calculated_percentage', rec.calculated_percentage,
          'calculated_status', rec.calculated_status,
          'total_units', rec.total_units_in_course,
          'completed_units', rec.actual_completed_units
        )
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
        
        -- Log the specific change
        v_debug_info := v_debug_info || ' | Updated ' || rec.email || ' course ' || rec.course_id || 
                       ': ' || rec.stored_percentage || '% -> ' || v_new_percentage || '% (' || 
                       rec.actual_completed_units || '/' || rec.total_units_in_course || ' units)';
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