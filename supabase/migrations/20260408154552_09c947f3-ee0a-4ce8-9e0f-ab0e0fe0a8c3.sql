ALTER TABLE public.wiki_articles
  ADD COLUMN content_type text NOT NULL DEFAULT 'policy',
  ADD COLUMN file_url text,
  ADD COLUMN file_name text;

COMMENT ON COLUMN public.wiki_articles.content_type IS 'Type of content: policy, procedure, or document';