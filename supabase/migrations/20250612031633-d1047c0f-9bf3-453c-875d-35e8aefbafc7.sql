
-- Update the update_user_role_safe function to include team_leader role
CREATE OR REPLACE FUNCTION public.update_user_role_safe(p_user_id uuid, p_new_role text, p_reason text DEFAULT 'Administrative role change'::text, p_performed_by uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$
