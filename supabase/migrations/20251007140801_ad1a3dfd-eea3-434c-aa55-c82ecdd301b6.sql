-- Modify soft_delete_user to automatically remove users from law firms and free up seats
CREATE OR REPLACE FUNCTION public.soft_delete_user(
  p_user_id uuid, 
  p_reason text DEFAULT 'Administrative action'::text, 
  p_performed_by uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_record RECORD;
    v_audit_id UUID;
    v_law_firm_id UUID;
    v_seat_freed BOOLEAN := false;
BEGIN
    -- Check if performer has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can soft delete users';
    END IF;

    -- Get current user data including law_firm_id
    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if user is already deleted
    IF v_user_record.is_deleted THEN
        RAISE EXCEPTION 'User is already deleted';
    END IF;

    -- Store law_firm_id before clearing it
    v_law_firm_id := v_user_record.law_firm_id;

    -- If user belongs to a law firm, free up their seat
    IF v_law_firm_id IS NOT NULL THEN
        UPDATE public.law_firms
        SET used_seats = GREATEST(0, used_seats - 1),
            updated_at = now()
        WHERE id = v_law_firm_id;
        
        v_seat_freed := true;
    END IF;

    -- Soft delete the user and clear law firm association
    UPDATE public.profiles 
    SET is_deleted = true, 
        deleted_at = now(),
        law_firm_id = NULL,
        updated_at = now()
    WHERE id = p_user_id;

    -- Log the action with law firm details
    INSERT INTO public.user_management_audit (
        target_user_id, action_type, performed_by, old_data, new_data, reason
    ) VALUES (
        p_user_id, 
        'soft_delete', 
        p_performed_by,
        row_to_json(v_user_record),
        jsonb_build_object(
            'is_deleted', true, 
            'deleted_at', now(),
            'law_firm_id_cleared', v_law_firm_id,
            'seat_freed', v_seat_freed,
            'previous_law_firm_id', v_law_firm_id
        ),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'law_firm_removed', v_law_firm_id,
        'seat_freed', v_seat_freed,
        'message', CASE 
            WHEN v_seat_freed THEN 'User successfully soft deleted and removed from law firm'
            ELSE 'User successfully soft deleted'
        END
    );
END;
$function$;

-- Modify restore_user to keep law_firm_id NULL (requires manual re-assignment)
CREATE OR REPLACE FUNCTION public.restore_user(
  p_user_id uuid, 
  p_reason text DEFAULT 'Administrative restoration'::text, 
  p_performed_by uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_record RECORD;
    v_audit_id UUID;
    v_had_law_firm BOOLEAN := false;
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

    -- Check audit log to see if user had a law firm before deletion
    SELECT EXISTS (
        SELECT 1 FROM public.user_management_audit
        WHERE target_user_id = p_user_id
        AND action_type = 'soft_delete'
        AND old_data->>'law_firm_id' IS NOT NULL
        ORDER BY performed_at DESC
        LIMIT 1
    ) INTO v_had_law_firm;

    -- Restore the user but keep law_firm_id as NULL
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
        jsonb_build_object(
            'is_deleted', false, 
            'deleted_at', null,
            'note', 'Law firm association not restored - requires manual re-assignment'
        ),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'message', 'User successfully restored. Law firm association was not restored and requires manual re-assignment.',
        'requires_law_firm_reassignment', v_had_law_firm
    );
END;
$function$;