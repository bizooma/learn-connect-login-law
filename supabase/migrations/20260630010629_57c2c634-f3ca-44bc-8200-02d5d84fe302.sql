ALTER TABLE public.wiki_categories DROP CONSTRAINT IF EXISTS wiki_categories_discoverability_check;
UPDATE public.wiki_categories SET discoverability = 'private' WHERE discoverability = 'restricted';
ALTER TABLE public.wiki_categories
  ADD CONSTRAINT wiki_categories_discoverability_check
  CHECK (discoverability IN ('discoverable','request','private'));