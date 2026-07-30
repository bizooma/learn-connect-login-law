-- 4a. Revoke admin from departed employees
DELETE FROM public.user_roles ur
USING public.profiles p
WHERE p.id = ur.user_id AND ur.role = 'admin' AND p.is_deleted = true;

-- 4b. Narrow the DB-level bypass on user_roles
DROP POLICY IF EXISTS "Direct admin bypass" ON public.user_roles;
CREATE POLICY "Direct admin bypass"
  ON public.user_roles FOR ALL
  USING ((auth.jwt() ->> 'email') = 'joe@bizooma.com');

-- 4c. Disable login for all soft-deleted users (data change, no schema)
UPDATE auth.users u SET banned_until = '2999-12-31 00:00:00+00'
FROM public.profiles p
WHERE p.id = u.id AND p.is_deleted = true AND u.banned_until IS NULL;

-- 2.1 soft_delete_user() also disables the login
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id uuid, p_reason text DEFAULT 'Administrative action'::text, p_performed_by uuid DEFAULT auth.uid())
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
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can soft delete users';
    END IF;

    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF v_user_record.is_deleted THEN
        RAISE EXCEPTION 'User is already deleted';
    END IF;

    v_law_firm_id := v_user_record.law_firm_id;

    IF v_law_firm_id IS NOT NULL THEN
        UPDATE public.law_firms
        SET used_seats = GREATEST(0, used_seats - 1),
            updated_at = now()
        WHERE id = v_law_firm_id;

        v_seat_freed := true;
    END IF;

    UPDATE public.profiles
    SET is_deleted = true,
        deleted_at = now(),
        law_firm_id = NULL,
        updated_at = now()
    WHERE id = p_user_id;

    -- Block sign-in without touching progress, certificates or profile data
    UPDATE auth.users
    SET banned_until = '2999-12-31 00:00:00+00'
    WHERE id = p_user_id;

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
            'previous_law_firm_id', v_law_firm_id,
            'login_disabled', true
        ),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'law_firm_removed', v_law_firm_id,
        'seat_freed', v_seat_freed,
        'login_disabled', true,
        'message', CASE
            WHEN v_seat_freed THEN 'User successfully soft deleted, login disabled and removed from law firm'
            ELSE 'User successfully soft deleted and login disabled'
        END
    );
END;
$function$;

-- 2.2 restore_user() also re-enables the login
CREATE OR REPLACE FUNCTION public.restore_user(p_user_id uuid, p_reason text DEFAULT 'Administrative restoration'::text, p_performed_by uuid DEFAULT auth.uid())
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
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can restore users';
    END IF;

    SELECT * INTO v_user_record FROM public.profiles WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT v_user_record.is_deleted THEN
        RAISE EXCEPTION 'User is not deleted';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_management_audit
        WHERE target_user_id = p_user_id
        AND action_type = 'soft_delete'
        AND old_data->>'law_firm_id' IS NOT NULL
    ) INTO v_had_law_firm;

    UPDATE public.profiles
    SET is_deleted = false,
        deleted_at = NULL,
        updated_at = now()
    WHERE id = p_user_id;

    -- Re-enable sign-in
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = p_user_id;

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
            'login_enabled', true,
            'note', 'Law firm association not restored - requires manual re-assignment'
        ),
        p_reason
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'audit_id', v_audit_id,
        'login_enabled', true,
        'message', 'User successfully restored and login re-enabled. Law firm association was not restored and requires manual re-assignment.',
        'requires_law_firm_reassignment', v_had_law_firm
    );
END;
$function$;