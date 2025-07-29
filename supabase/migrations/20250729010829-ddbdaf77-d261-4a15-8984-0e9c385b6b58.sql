-- Fix remaining database functions with search_path for security

-- Fix mark_course_completed function
CREATE OR REPLACE FUNCTION public.mark_course_completed(p_user_id uuid, p_course_id uuid, p_completion_date timestamp with time zone DEFAULT now())
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can mark courses as completed for other users';
  END IF;

  -- Create or update user course progress
  INSERT INTO public.user_course_progress (
    user_id,
    course_id,
    status,
    progress_percentage,
    started_at,
    completed_at,
    last_accessed_at
  )
  VALUES (
    p_user_id,
    p_course_id,
    'completed',
    100,
    p_completion_date,
    p_completion_date,
    p_completion_date
  )
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET
    status = 'completed',
    progress_percentage = 100,
    completed_at = p_completion_date,
    last_accessed_at = p_completion_date,
    updated_at = now();

  -- Create assignment record if it doesn't exist
  INSERT INTO public.course_assignments (
    user_id,
    course_id,
    assigned_by,
    assigned_at,
    notes
  )
  VALUES (
    p_user_id,
    p_course_id,
    auth.uid(),
    p_completion_date,
    'Migrated from Kajabi - marked as completed'
  )
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET
    notes = COALESCE(course_assignments.notes, '') || ' | Marked as completed on ' || p_completion_date::text,
    updated_at = now();
END;
$function$;

-- Fix admin_recalculate_all_progress function
CREATE OR REPLACE FUNCTION public.admin_recalculate_all_progress(p_reason text DEFAULT 'Administrative bulk progress recalculation'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix assign_badge_to_user function
CREATE OR REPLACE FUNCTION public.assign_badge_to_user(p_user_id uuid, p_badge_name text, p_description text, p_badge_image_url text DEFAULT NULL::text, p_badge_color text DEFAULT '#FFD700'::text, p_assigned_by uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_achievement_id UUID;
BEGIN
  -- Check if performer has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_assigned_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign badges';
  END IF;

  -- Check if user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_user_id AND is_deleted = false
  ) THEN
    RAISE EXCEPTION 'User not found or is deleted';
  END IF;

  -- Check if user already has this badge
  IF EXISTS (
    SELECT 1 FROM public.user_achievements 
    WHERE user_id = p_user_id 
    AND badge_name = p_badge_name 
    AND is_badge = true
  ) THEN
    RAISE EXCEPTION 'User already has this badge';
  END IF;

  -- Insert the badge achievement
  INSERT INTO public.user_achievements (
    user_id,
    achievement_type,
    achievement_name,
    description,
    badge_name,
    badge_image_url,
    badge_color,
    is_badge,
    assigned_by,
    metadata
  ) VALUES (
    p_user_id,
    'manual_badge',
    p_badge_name,
    p_description,
    p_badge_name,
    p_badge_image_url,
    p_badge_color,
    true,
    p_assigned_by,
    jsonb_build_object(
      'assigned_manually', true,
      'assigned_at', now(),
      'assigned_by', p_assigned_by
    )
  ) RETURNING id INTO v_achievement_id;

  RETURN v_achievement_id;
END;
$function$;

-- Fix soft_delete_user function
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id uuid, p_reason text DEFAULT 'Administrative action'::text, p_performed_by uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_record RECORD;
    v_audit_id UUID;
BEGIN
    -- Check if performer has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can soft delete users';
    END IF;

    -- Get current user data
    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if user is already deleted
    IF v_user_record.is_deleted THEN
        RAISE EXCEPTION 'User is already deleted';
    END IF;

    -- Soft delete the user
    UPDATE public.profiles 
    SET is_deleted = true, 
        deleted_at = now(),
        updated_at = now()
    WHERE id = p_user_id;

    -- Log the action
    INSERT INTO public.user_management_audit (
        target_user_id, action_type, performed_by, old_data, new_data, reason
    ) VALUES (
        p_user_id, 
        'soft_delete', 
        p_performed_by,
        row_to_json(v_user_record),
        jsonb_build_object('is_deleted', true, 'deleted_at', now()),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'message', 'User successfully soft deleted'
    );
END;
$function$;

-- Fix restore_user function  
CREATE OR REPLACE FUNCTION public.restore_user(p_user_id uuid, p_reason text DEFAULT 'Administrative restoration'::text, p_performed_by uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_record RECORD;
    v_audit_id UUID;
BEGIN
    -- Check if performer has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can restore users';
    END IF;

    -- Get current user data
    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if user is actually deleted
    IF NOT v_user_record.is_deleted THEN
        RAISE EXCEPTION 'User is not deleted';
    END IF;

    -- Restore the user
    UPDATE public.profiles 
    SET is_deleted = false, 
        deleted_at = NULL,
        updated_at = now()
    WHERE id = p_user_id;

    -- Log the action
    INSERT INTO public.user_management_audit (
        target_user_id, action_type, performed_by, old_data, new_data, reason
    ) VALUES (
        p_user_id, 
        'restore', 
        p_performed_by,
        row_to_json(v_user_record),
        jsonb_build_object('is_deleted', false, 'deleted_at', null),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'message', 'User successfully restored'
    );
END;
$function$;

-- Fix update_user_role_safe function
CREATE OR REPLACE FUNCTION public.update_user_role_safe(p_user_id uuid, p_new_role text, p_reason text DEFAULT 'Administrative role change'::text, p_performed_by uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_old_role TEXT;
    v_audit_id UUID;
    v_role_audit_id UUID;
BEGIN
    -- Check if performer has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Validate new role (updated to include team_leader)
    IF p_new_role NOT IN ('admin', 'owner', 'student', 'client', 'free', 'team_leader') THEN
        RAISE EXCEPTION 'Invalid role: %', p_new_role;
    END IF;

    -- Get current role
    SELECT role INTO v_old_role FROM public.user_roles WHERE user_id = p_user_id;

    -- Prevent admins from removing admin role from themselves
    IF p_performed_by = p_user_id AND v_old_role = 'admin' AND p_new_role != 'admin' THEN
        RAISE EXCEPTION 'Admins cannot remove their own admin role';
    END IF;

    -- Start transaction for safe role update
    BEGIN
        -- Delete existing role
        DELETE FROM public.user_roles WHERE user_id = p_user_id;
        
        -- Insert new role
        INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_new_role::app_role);
        
        -- Log role change
        INSERT INTO public.user_role_audit (
            user_id, old_role, new_role, changed_by, reason
        ) VALUES (
            p_user_id, v_old_role, p_new_role, p_performed_by, p_reason
        ) RETURNING id INTO v_role_audit_id;

        -- Log in user management audit
        INSERT INTO public.user_management_audit (
            target_user_id, action_type, performed_by, old_data, new_data, reason
        ) VALUES (
            p_user_id, 
            'role_change', 
            p_performed_by,
            jsonb_build_object('role', v_old_role),
            jsonb_build_object('role', p_new_role),
            p_reason
        ) RETURNING id INTO v_audit_id;

    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        RAISE;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'old_role', v_old_role,
        'new_role', p_new_role,
        'audit_id', v_audit_id,
        'role_audit_id', v_role_audit_id,
        'message', 'Role successfully updated'
    );
END;
$function$;