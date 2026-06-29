
CREATE TABLE public.wiki_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;
GRANT ALL ON public.wiki_pages TO service_role;

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage wiki pages"
  ON public.wiki_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Authenticated read published pages"
  ON public.wiki_pages FOR SELECT TO authenticated
  USING (is_published = true);

CREATE INDEX idx_wiki_pages_article_id ON public.wiki_pages(article_id);

CREATE TRIGGER update_wiki_pages_updated_at
  BEFORE UPDATE ON public.wiki_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
