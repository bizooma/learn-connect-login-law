
-- Documents RLS state applied directly in Supabase on 2026-07-20 to close a
-- cross-tenant wiki leak. Idempotent: safe to re-run. No behavior change on
-- the current DB; exists so future deploys can't regenerate older policies
-- that would re-open the leak.

-- Helper: is the user a member of the NFU "Everyone" group?
CREATE OR REPLACE FUNCTION public.is_nfu_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = _user_id
      AND gm.group_id = '008118df-8da5-4b7d-8fdb-998d3e86f531'
  );
$$;

-- wiki_categories
DROP POLICY IF EXISTS "Anyone can view published wiki categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "NFU staff view published wiki categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_categories_admin_only_gate" ON public.wiki_categories;

CREATE POLICY "NFU staff view published wiki categories"
ON public.wiki_categories
FOR SELECT
TO authenticated
USING (is_published = true AND public.is_nfu_staff(auth.uid()));

CREATE POLICY "wiki_categories_admin_only_gate"
ON public.wiki_categories
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- wiki_articles
DROP POLICY IF EXISTS "Anyone can view published wiki articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "NFU staff view published wiki articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_articles_admin_only_gate" ON public.wiki_articles;

CREATE POLICY "NFU staff view published wiki articles"
ON public.wiki_articles
FOR SELECT
TO authenticated
USING (is_published = true AND public.is_nfu_staff(auth.uid()));

CREATE POLICY "wiki_articles_admin_only_gate"
ON public.wiki_articles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- wiki_pages
DROP POLICY IF EXISTS "Anyone can view published wiki pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "NFU staff read published pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_admin_only_gate" ON public.wiki_pages;

CREATE POLICY "NFU staff read published pages"
ON public.wiki_pages
FOR SELECT
TO authenticated
USING (is_published = true AND public.is_nfu_staff(auth.uid()));

CREATE POLICY "wiki_pages_admin_only_gate"
ON public.wiki_pages
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
