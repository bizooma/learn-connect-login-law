
CREATE TABLE public.wiki_category_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_level text NOT NULL DEFAULT 'view' CHECK (access_level IN ('view','edit','full')),
  completion_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_category_users TO authenticated;
GRANT ALL ON public.wiki_category_users TO service_role;

ALTER TABLE public.wiki_category_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wiki_category_users_select" ON public.wiki_category_users
FOR SELECT TO authenticated USING (true);

CREATE POLICY "wiki_category_users_manage" ON public.wiki_category_users
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.can_edit_wiki_category(auth.uid(), category_id))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.can_edit_wiki_category(auth.uid(), category_id));

CREATE INDEX idx_wiki_category_users_category ON public.wiki_category_users(category_id);
CREATE INDEX idx_wiki_category_users_user ON public.wiki_category_users(user_id);

-- Extend access function to include individual user shares
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
  v_group_access text;
  v_user_access text;
  v_best text;
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

  SELECT CASE
           WHEN bool_or(wcu.access_level = 'full') THEN 'full'
           WHEN bool_or(wcu.access_level = 'edit') THEN 'edit'
           WHEN bool_or(wcu.access_level = 'view') THEN 'view'
           ELSE NULL
         END
    INTO v_user_access
  FROM public.wiki_category_users wcu
  WHERE wcu.category_id = _category_id AND wcu.user_id = _user_id;

  -- Pick the highest of group/user access
  v_best := NULL;
  IF v_group_access = 'full' OR v_user_access = 'full' THEN
    v_best := 'full';
  ELSIF v_group_access = 'edit' OR v_user_access = 'edit' THEN
    v_best := 'edit';
  ELSIF v_group_access = 'view' OR v_user_access = 'view' THEN
    v_best := 'view';
  END IF;

  IF v_best IS NOT NULL THEN
    RETURN v_best;
  END IF;

  IF COALESCE(v_is_published, false) AND COALESCE(v_discoverability, 'discoverable') = 'discoverable' THEN
    RETURN 'view';
  END IF;

  RETURN 'none';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_wiki_category_users_updated_at ON public.wiki_category_users;
CREATE TRIGGER update_wiki_category_users_updated_at
BEFORE UPDATE ON public.wiki_category_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
