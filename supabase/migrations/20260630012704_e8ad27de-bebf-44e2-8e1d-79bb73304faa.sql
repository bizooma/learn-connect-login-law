
-- Effective access level for a user on a wiki category
CREATE OR REPLACE FUNCTION public.wiki_category_access(_user_id uuid, _category_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_owner uuid;
  v_discoverability text;
  v_is_published boolean;
  v_best text;
  v_group_access text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'none';
  END IF;

  SELECT public.has_role(_user_id, 'admin'::app_role) INTO v_is_admin;
  IF v_is_admin THEN
    RETURN 'full';
  END IF;

  SELECT owner_id, discoverability, is_published
    INTO v_owner, v_discoverability, v_is_published
  FROM public.wiki_categories WHERE id = _category_id;

  IF NOT FOUND THEN
    RETURN 'none';
  END IF;

  IF v_owner = _user_id THEN
    RETURN 'full';
  END IF;

  -- Highest access level via group membership
  SELECT CASE
           WHEN bool_or(wcg.access_level = 'full') THEN 'full'
           WHEN bool_or(wcg.access_level = 'edit') THEN 'edit'
           WHEN bool_or(wcg.access_level = 'view') THEN 'view'
           ELSE NULL
         END
    INTO v_group_access
  FROM public.wiki_category_groups wcg
  JOIN public.group_members gm ON gm.group_id = wcg.group_id
  WHERE wcg.category_id = _category_id AND gm.user_id = _user_id;

  IF v_group_access IS NOT NULL THEN
    RETURN v_group_access;
  END IF;

  -- Discoverable + published => view
  IF COALESCE(v_is_published, false) AND COALESCE(v_discoverability, 'discoverable') = 'discoverable' THEN
    RETURN 'view';
  END IF;

  RETURN 'none';
END;
$$;

-- Convenience: can edit
CREATE OR REPLACE FUNCTION public.can_edit_wiki_category(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.wiki_category_access(_user_id, _category_id) IN ('edit','full');
$$;

CREATE OR REPLACE FUNCTION public.can_delete_wiki_category(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.wiki_category_access(_user_id, _category_id) = 'full';
$$;

CREATE OR REPLACE FUNCTION public.can_view_wiki_category(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.wiki_category_access(_user_id, _category_id) IN ('view','edit','full');
$$;

-- Rewrite RLS on wiki_categories
DROP POLICY IF EXISTS "Anyone can view published categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_categories_select" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_categories_insert" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_categories_update" ON public.wiki_categories;
DROP POLICY IF EXISTS "wiki_categories_delete" ON public.wiki_categories;

CREATE POLICY "wiki_categories_select" ON public.wiki_categories
FOR SELECT TO authenticated
USING (public.can_view_wiki_category(auth.uid(), id));

CREATE POLICY "wiki_categories_insert" ON public.wiki_categories
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "wiki_categories_update" ON public.wiki_categories
FOR UPDATE TO authenticated
USING (public.can_edit_wiki_category(auth.uid(), id))
WITH CHECK (public.can_edit_wiki_category(auth.uid(), id));

CREATE POLICY "wiki_categories_delete" ON public.wiki_categories
FOR DELETE TO authenticated
USING (public.can_delete_wiki_category(auth.uid(), id));

-- Rewrite RLS on wiki_articles (inherit from category)
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Authenticated users can view articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can view all articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_articles_select" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_articles_insert" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_articles_update" ON public.wiki_articles;
DROP POLICY IF EXISTS "wiki_articles_delete" ON public.wiki_articles;

CREATE POLICY "wiki_articles_select" ON public.wiki_articles
FOR SELECT TO authenticated
USING (public.can_view_wiki_category(auth.uid(), category_id));

CREATE POLICY "wiki_articles_insert" ON public.wiki_articles
FOR INSERT TO authenticated
WITH CHECK (public.can_edit_wiki_category(auth.uid(), category_id));

CREATE POLICY "wiki_articles_update" ON public.wiki_articles
FOR UPDATE TO authenticated
USING (public.can_edit_wiki_category(auth.uid(), category_id))
WITH CHECK (public.can_edit_wiki_category(auth.uid(), category_id));

CREATE POLICY "wiki_articles_delete" ON public.wiki_articles
FOR DELETE TO authenticated
USING (public.can_edit_wiki_category(auth.uid(), category_id));

-- Rewrite RLS on wiki_pages (inherit via article -> category)
DROP POLICY IF EXISTS "Anyone can view published pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Authenticated users can view pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Admins can insert pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Admins can update pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "Admins can delete pages" ON public.wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_select" ON public.wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_insert" ON public.wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_update" ON public.wiki_pages;
DROP POLICY IF EXISTS "wiki_pages_delete" ON public.wiki_pages;

CREATE POLICY "wiki_pages_select" ON public.wiki_pages
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wiki_articles a
  WHERE a.id = wiki_pages.article_id
    AND public.can_view_wiki_category(auth.uid(), a.category_id)
));

CREATE POLICY "wiki_pages_insert" ON public.wiki_pages
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wiki_articles a
  WHERE a.id = wiki_pages.article_id
    AND public.can_edit_wiki_category(auth.uid(), a.category_id)
));

CREATE POLICY "wiki_pages_update" ON public.wiki_pages
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wiki_articles a
  WHERE a.id = wiki_pages.article_id
    AND public.can_edit_wiki_category(auth.uid(), a.category_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wiki_articles a
  WHERE a.id = wiki_pages.article_id
    AND public.can_edit_wiki_category(auth.uid(), a.category_id)
));

CREATE POLICY "wiki_pages_delete" ON public.wiki_pages
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.wiki_articles a
  WHERE a.id = wiki_pages.article_id
    AND public.can_edit_wiki_category(auth.uid(), a.category_id)
));
