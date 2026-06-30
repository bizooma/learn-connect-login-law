ALTER TABLE public.wiki_category_groups
  ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS completion_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.wiki_category_groups
  ADD CONSTRAINT wiki_category_groups_access_level_check
  CHECK (access_level IN ('view','edit','full'));

ALTER TABLE public.wiki_categories
  ADD COLUMN IF NOT EXISTS discoverability text NOT NULL DEFAULT 'discoverable',
  ADD COLUMN IF NOT EXISTS public_share_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.wiki_categories
  ADD CONSTRAINT wiki_categories_discoverability_check
  CHECK (discoverability IN ('discoverable','restricted'));