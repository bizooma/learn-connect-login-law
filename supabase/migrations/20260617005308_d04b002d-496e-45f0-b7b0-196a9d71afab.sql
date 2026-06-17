CREATE TYPE public.wiki_subject_category AS ENUM ('policy', 'procedure', 'company');

ALTER TABLE public.wiki_categories
  ADD COLUMN category public.wiki_subject_category NOT NULL DEFAULT 'company';