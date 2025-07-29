-- CRITICAL SECURITY FIX: Enable RLS on unprotected tables
-- Fix for orphaned_progress_backup table
ALTER TABLE public.orphaned_progress_backup ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for orphaned_progress_backup
CREATE POLICY "Admins can manage orphaned progress backup" 
ON public.orphaned_progress_backup 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix for completion_migration_backup table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completion_migration_backup') THEN
    ALTER TABLE public.completion_migration_backup ENABLE ROW LEVEL SECURITY;
    
    -- Create admin-only policy for completion_migration_backup
    CREATE POLICY "Admins can manage completion migration backup" 
    ON public.completion_migration_backup 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

-- SECURITY FIX: Add search_path to database functions for security
-- Fix bulk_recalculate_course_progress function
CREATE OR REPLACE FUNCTION public.bulk_recalculate_course_progress(p_audit_reason text DEFAULT 'Comprehensive progress recalculation'::text)
 RETURNS TABLE(courses_updated integer, users_affected integer, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix admin_mark_unit_completed function
CREATE OR REPLACE FUNCTION public.admin_mark_unit_completed(p_user_id uuid, p_unit_id uuid, p_course_id uuid, p_reason text DEFAULT 'Administrative completion'::text, p_performed_by uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_progress RECORD;
  v_audit_id UUID;
  v_unit_exists BOOLEAN;
  v_user_enrolled BOOLEAN;
  v_unit_belongs_to_course BOOLEAN;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_performed_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can mark units as completed for other users';
  END IF;

  -- Validate unit exists and belongs to the course
  SELECT EXISTS(
    SELECT 1 FROM public.units u
    JOIN public.lessons l ON u.section_id = l.id
    WHERE u.id = p_unit_id AND l.course_id = p_course_id
  ) INTO v_unit_belongs_to_course;
  
  IF NOT v_unit_belongs_to_course THEN
    RAISE EXCEPTION 'Unit does not exist or does not belong to this course';
  END IF;

  -- Check if user exists
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;

  -- Check if user has course assignment OR course progress (flexible check)
  SELECT EXISTS(
    SELECT 1 FROM public.course_assignments 
    WHERE user_id = p_user_id AND course_id = p_course_id
    UNION
    SELECT 1 FROM public.user_course_progress 
    WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO v_user_enrolled;

  -- If user is not enrolled, create the necessary records
  IF NOT v_user_enrolled THEN
    -- Create course assignment
    INSERT INTO public.course_assignments (
      user_id,
      course_id,
      assigned_by,
      assigned_at,
      notes
    ) VALUES (
      p_user_id,
      p_course_id,
      p_performed_by,
      now(),
      'Created automatically during admin unit completion override'
    );

    -- Create course progress
    INSERT INTO public.user_course_progress (
      user_id,
      course_id,
      status,
      progress_percentage,
      started_at,
      last_accessed_at
    ) VALUES (
      p_user_id,
      p_course_id,
      'in_progress',
      0,
      now(),
      now()
    );
  END IF;

  -- Get existing progress for backup
  SELECT * INTO v_existing_progress 
  FROM public.user_unit_progress 
  WHERE user_id = p_user_id AND unit_id = p_unit_id AND course_id = p_course_id;

  -- Create or update unit progress
  INSERT INTO public.user_unit_progress (
    user_id,
    unit_id,
    course_id,
    completed,
    completed_at,
    completion_method,
    updated_at
  )
  VALUES (
    p_user_id,
    p_unit_id,
    p_course_id,
    true,
    now(),
    'admin_override',
    now()
  )
  ON CONFLICT (user_id, unit_id, course_id) 
  DO UPDATE SET
    completed = true,
    completed_at = now(),
    completion_method = 'admin_override',
    updated_at = now();

  -- Log the action in user management audit
  INSERT INTO public.user_management_audit (
    target_user_id,
    action_type,
    performed_by,
    old_data,
    new_data,
    reason
  ) VALUES (
    p_user_id,
    'unit_completion_override',
    p_performed_by,
    CASE WHEN v_existing_progress.id IS NOT NULL 
         THEN row_to_json(v_existing_progress) 
         ELSE NULL END,
    jsonb_build_object(
      'unit_id', p_unit_id,
      'course_id', p_course_id,
      'completed', true,
      'completion_method', 'admin_override'
    ),
    p_reason
  ) RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'unit_id', p_unit_id,
    'course_id', p_course_id,
    'audit_id', v_audit_id,
    'message', 'Unit successfully marked as completed by admin'
  );
END;
$function$;

-- Fix other critical functions with search_path
CREATE OR REPLACE FUNCTION public.update_course_progress_reliable(p_user_id uuid, p_course_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_units INTEGER := 0;
  v_completed_units INTEGER := 0;
  v_calculated_percentage INTEGER := 0;
  v_calculated_status TEXT := 'not_started';
  v_old_progress RECORD;
  v_should_update BOOLEAN := false;
  v_debug_info TEXT := '';
BEGIN
  -- Get current progress for comparison and backup
  SELECT * INTO v_old_progress 
  FROM user_course_progress 
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Use the SAME calculation logic as bulk_recalculate_course_progress
  -- Count total units for this course
  SELECT COUNT(DISTINCT u.id)
  INTO v_total_units
  FROM public.units u
  WHERE EXISTS (
    SELECT 1 FROM public.lessons l 
    WHERE l.id = u.section_id AND l.course_id = p_course_id
  );
  
  -- Count completed units for this user and course
  SELECT COUNT(DISTINCT u.id)
  INTO v_completed_units  
  FROM public.units u
  WHERE EXISTS (
    SELECT 1 FROM public.lessons l 
    WHERE l.id = u.section_id AND l.course_id = p_course_id
  )
  AND EXISTS (
    SELECT 1 FROM public.user_unit_progress uup 
    WHERE uup.user_id = p_user_id 
    AND uup.course_id = p_course_id 
    AND uup.unit_id = u.id
    AND uup.completed = true
  );

  -- Calculate percentage and status using same logic as bulk function
  IF v_total_units > 0 THEN 
    v_calculated_percentage := LEAST(100, (v_completed_units * 100) / v_total_units);
  ELSE 
    v_calculated_percentage := 0;
  END IF;
  
  IF v_total_units > 0 AND (v_completed_units * 100) / v_total_units = 100 THEN
    v_calculated_status := 'completed';
  ELSIF v_completed_units > 0 THEN
    v_calculated_status := 'in_progress';
  ELSE
    v_calculated_status := 'not_started';
  END IF;

  -- Build debug info
  v_debug_info := 'Calculated: ' || v_calculated_percentage || '% (' || v_completed_units || '/' || v_total_units || ' units)';
  
  -- Progress protection logic: only update if it's genuinely better or first time
  IF v_old_progress.id IS NULL THEN
    -- No existing progress record - create new one
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Creating new progress record';
  ELSIF v_calculated_percentage > v_old_progress.progress_percentage THEN
    -- Progress increased - always update
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Progress increased from ' || v_old_progress.progress_percentage || '%';
  ELSIF v_calculated_percentage = v_old_progress.progress_percentage AND v_calculated_status != v_old_progress.status THEN
    -- Same percentage but status changed (e.g., completed_at timestamp)
    v_should_update := true;
    v_debug_info := v_debug_info || ' | Status changed from ' || v_old_progress.status || ' to ' || v_calculated_status;
  ELSE
    -- Would downgrade progress - don't update unless it's a significant discrepancy
    IF ABS(v_calculated_percentage - v_old_progress.progress_percentage) > 10 THEN
      -- Large discrepancy suggests data issue - log but don't auto-fix
      v_debug_info := v_debug_info || ' | WARNING: Large discrepancy detected but not auto-fixing. Stored: ' || v_old_progress.progress_percentage || '%';
    ELSE
      -- Small discrepancy - preserve existing progress
      v_debug_info := v_debug_info || ' | Preserving existing progress: ' || v_old_progress.progress_percentage || '%';
    END IF;
    v_should_update := false;
  END IF;

  -- Only update if we determined it's safe and beneficial
  IF v_should_update THEN
    INSERT INTO user_course_progress (
      user_id, course_id, progress_percentage, status, 
      started_at, completed_at, last_accessed_at
    ) VALUES (
      p_user_id, p_course_id, v_calculated_percentage, v_calculated_status,
      COALESCE(v_old_progress.started_at, now()),
      CASE WHEN v_calculated_status = 'completed' THEN COALESCE(v_old_progress.completed_at, now()) ELSE v_old_progress.completed_at END,
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
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated', v_should_update,
    'progress_percentage', COALESCE(v_old_progress.progress_percentage, v_calculated_percentage),
    'calculated_percentage', v_calculated_percentage,
    'status', COALESCE(v_old_progress.status, v_calculated_status),
    'calculated_status', v_calculated_status,
    'total_units', v_total_units,
    'completed_units', v_completed_units,
    'debug_info', v_debug_info
  );
END;
$function$;