
-- 1) Table
CREATE TABLE public.wiki_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('admin','author','contributor','general')),
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_permissions TO authenticated;
GRANT ALL ON public.wiki_permissions TO service_role;

ALTER TABLE public.wiki_permissions ENABLE ROW LEVEL SECURITY;

-- 2) Helper function: effective P&P level for a user
CREATE OR REPLACE FUNCTION public.pnp_permission_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN 'general'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role IN ('admin','owner')
    ) THEN 'admin'
    ELSE COALESCE(
      (SELECT level FROM public.wiki_permissions WHERE user_id = _user_id),
      'general'
    )
  END;
$$;

-- 3) Convenience: check if user is P&P admin
CREATE OR REPLACE FUNCTION public.is_pnp_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.pnp_permission_level(_user_id) = 'admin';
$$;

-- 4) RLS policies on wiki_permissions
CREATE POLICY "wiki_permissions_admin_all"
  ON public.wiki_permissions
  FOR ALL
  TO authenticated
  USING (public.is_pnp_admin(auth.uid()))
  WITH CHECK (public.is_pnp_admin(auth.uid()));

-- Everyone authenticated can read their OWN permission row (for tab visibility)
CREATE POLICY "wiki_permissions_self_read"
  ON public.wiki_permissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5) updated_at trigger
CREATE TRIGGER update_wiki_permissions_updated_at
  BEFORE UPDATE ON public.wiki_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Seed: current testers keep P&P access at 'general'
INSERT INTO public.wiki_permissions (user_id, level)
SELECT DISTINCT ur.user_id, 'general'
FROM public.user_roles ur
WHERE ur.role = 'tester'
  AND NOT EXISTS (
    SELECT 1 FROM public.wiki_permissions wp WHERE wp.user_id = ur.user_id
  );
