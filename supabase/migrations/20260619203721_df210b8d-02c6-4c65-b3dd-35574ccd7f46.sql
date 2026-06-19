ALTER TABLE public.wiki_articles
  ADD COLUMN IF NOT EXISTS subject_category text;

UPDATE public.wiki_articles a
SET subject_category = c.category
FROM public.wiki_categories c
WHERE a.category_id = c.id
  AND a.subject_category IS NULL;

ALTER TABLE public.wiki_articles
  ADD CONSTRAINT wiki_articles_subject_category_check
  CHECK (subject_category IN ('company','policy','procedure'));