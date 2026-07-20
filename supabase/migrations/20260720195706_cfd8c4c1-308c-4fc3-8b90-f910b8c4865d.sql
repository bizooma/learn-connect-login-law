
-- 1) Drop leftover one-role-per-user constraint (keeps UNIQUE(user_id, role))
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- 2) Preserve additive roles (e.g., tester) when changing a user's primary role
CREATE OR REPLACE FUNCTION public.update_user_role_safe(
    p_user_id uuid,
    p_new_role text,
    p_reason text DEFAULT 'Administrative role change'::text,
    p_performed_by uuid DEFAULT auth.uid()
)
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
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_performed_by AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    IF p_new_role NOT IN ('admin', 'owner', 'student', 'client', 'free', 'team_leader') THEN
        RAISE EXCEPTION 'Invalid role: %', p_new_role;
    END IF;

    -- Primary role = any role other than the additive 'tester'
    SELECT role INTO v_old_role
    FROM public.user_roles
    WHERE user_id = p_user_id AND role <> 'tester'
    LIMIT 1;

    IF p_performed_by = p_user_id AND v_old_role = 'admin' AND p_new_role <> 'admin' THEN
        RAISE EXCEPTION 'Admins cannot remove their own admin role';
    END IF;

    BEGIN
        -- Only remove the primary role; preserve additive roles like 'tester'
        DELETE FROM public.user_roles
        WHERE user_id = p_user_id AND role <> 'tester';

        INSERT INTO public.user_roles (user_id, role)
        VALUES (p_user_id, p_new_role::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;

        INSERT INTO public.user_role_audit (
            user_id, old_role, new_role, changed_by, reason
        ) VALUES (
            p_user_id, v_old_role, p_new_role, p_performed_by, p_reason
        ) RETURNING id INTO v_role_audit_id;

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

-- 3) Record wiki access rules already applied directly in Supabase (idempotent)
CREATE OR REPLACE FUNCTION public.is_nfu_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = _user_id
      AND gm.group_id = '008118df-8da5-4b7d-8fdb-998d3e86f531'
  );
$$;

DROP POLICY IF EXISTS "Authenticated read published pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Authenticated users can view published wiki articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Authenticated users can view published wiki categories" ON public.wiki_categories;

DROP POLICY IF EXISTS "NFU staff read published pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "NFU staff view published wiki articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "NFU staff view published wiki categories" ON public.wiki_categories;

CREATE POLICY "NFU staff read published pages" ON public.wiki_pages
  FOR SELECT TO authenticated
  USING (is_published = true AND public.is_nfu_staff(auth.uid()));

CREATE POLICY "NFU staff view published wiki articles" ON public.wiki_articles
  FOR SELECT TO authenticated
  USING (is_published = true AND public.is_nfu_staff(auth.uid()));

CREATE POLICY "NFU staff view published wiki categories" ON public.wiki_categories
  FOR SELECT TO authenticated
  USING (is_published = true AND public.is_nfu_staff(auth.uid()));

DROP POLICY IF EXISTS "wiki_categories_prelaunch_gate" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_articles_prelaunch_gate" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_pages_prelaunch_gate" ON public.wiki_pages;

CREATE POLICY "wiki_categories_prelaunch_gate" ON public.wiki_categories
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'tester'::app_role));

CREATE POLICY "wiki_articles_prelaunch_gate" ON public.wiki_articles
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'tester'::app_role));

CREATE POLICY "wiki_pages_prelaunch_gate" ON public.wiki_pages
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'tester'::app_role));

DROP POLICY IF EXISTS "Testers preview published wiki categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Testers preview published wiki articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Testers preview published wiki pages" ON public.wiki_pages;

CREATE POLICY "Testers preview published wiki categories" ON public.wiki_categories
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_role(auth.uid(),'tester'::app_role));

CREATE POLICY "Testers preview published wiki articles" ON public.wiki_articles
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_role(auth.uid(),'tester'::app_role));

CREATE POLICY "Testers preview published wiki pages" ON public.wiki_pages
  FOR SELECT TO authenticated
  USING (is_published = true AND public.has_role(auth.uid(),'tester'::app_role));
