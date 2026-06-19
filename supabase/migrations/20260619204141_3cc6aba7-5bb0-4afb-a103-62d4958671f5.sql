ALTER TABLE public.wiki_articles
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS wiki_articles_owner_id_idx ON public.wiki_articles(owner_id);