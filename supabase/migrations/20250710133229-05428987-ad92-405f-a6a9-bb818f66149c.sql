-- Create function to cancel owner account and downgrade all associated users
CREATE OR REPLACE FUNCTION public.cancel_owner_account(p_owner_id uuid, p_reason text DEFAULT 'Account cancellation'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_law_firm RECORD;
    v_employees_updated INTEGER := 0;
    v_audit_id UUID;
BEGIN
    -- Check if user is the owner requesting cancellation or an admin
    IF NOT (auth.uid() = p_owner_id OR public.is_admin_user()) THEN
        RAISE EXCEPTION 'Only the account owner or admin can cancel this account';
    END IF;

    -- Get law firm details
    SELECT * INTO v_law_firm FROM public.law_firms WHERE owner_id = p_owner_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No law firm found for this owner';
    END IF;

    -- Update all employees from student to free role
    WITH employee_updates AS (
        UPDATE public.user_roles 
        SET role = 'free'::app_role, created_at = now()
        WHERE user_id IN (
            SELECT p.id 
            FROM public.profiles p 
            WHERE p.law_firm_id = v_law_firm.id 
            AND p.id != p_owner_id
            AND p.is_deleted = false
        ) 
        AND role = 'student'::app_role
        RETURNING user_id
    )
    SELECT COUNT(*) INTO v_employees_updated FROM employee_updates;

    -- Update owner role from owner to free
    UPDATE public.user_roles 
    SET role = 'free'::app_role, created_at = now()
    WHERE user_id = p_owner_id AND role = 'owner'::app_role;

    -- Mark law firm as cancelled (add a cancelled status)
    UPDATE public.law_firms 
    SET updated_at = now()
    WHERE id = v_law_firm.id;

    -- Log the cancellation in audit
    INSERT INTO public.user_management_audit (
        target_user_id,
        action_type,
        performed_by,
        old_data,
        new_data,
        reason
    ) VALUES (
        p_owner_id,
        'account_cancellation',
        auth.uid(),
        jsonb_build_object(
            'law_firm_id', v_law_firm.id,
            'law_firm_name', v_law_firm.name,
            'employees_count', v_employees_updated
        ),
        jsonb_build_object(
            'owner_role_changed_to', 'free',
            'employees_role_changed_to', 'free',
            'employees_affected', v_employees_updated
        ),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'law_firm_id', v_law_firm.id,
        'law_firm_name', v_law_firm.name,
        'employees_updated', v_employees_updated,
        'audit_id', v_audit_id,
        'message', 'Account successfully cancelled. Owner and ' || v_employees_updated || ' employees downgraded to free accounts.'
    );
END;
$function$;