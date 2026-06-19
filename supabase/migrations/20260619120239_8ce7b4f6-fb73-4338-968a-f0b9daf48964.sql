CREATE TABLE public.wiki_article_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX wiki_article_views_article_idx ON public.wiki_article_views(article_id);
CREATE INDEX wiki_article_views_user_idx ON public.wiki_article_views(user_id);
CREATE INDEX wiki_article_views_viewed_at_idx ON public.wiki_article_views(viewed_at DESC);

GRANT SELECT, INSERT ON public.wiki_article_views TO authenticated;
GRANT ALL ON public.wiki_article_views TO service_role;

ALTER TABLE public.wiki_article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their own views"
ON public.wiki_article_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own views"
ON public.wiki_article_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all views"
ON public.wiki_article_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));