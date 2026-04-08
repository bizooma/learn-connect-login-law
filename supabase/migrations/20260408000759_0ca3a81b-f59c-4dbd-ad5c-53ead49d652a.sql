
-- Create wiki_categories table
CREATE TABLE public.wiki_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'FileText',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wiki categories"
  ON public.wiki_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Authenticated users can view published wiki categories"
  ON public.wiki_categories FOR SELECT TO authenticated
  USING (is_published = true);

-- Create wiki_articles table
CREATE TABLE public.wiki_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wiki articles"
  ON public.wiki_articles FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Authenticated users can view published wiki articles"
  ON public.wiki_articles FOR SELECT TO authenticated
  USING (is_published = true);

-- Create wiki_article_groups table (future access control)
CREATE TABLE public.wiki_article_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.admin_teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, team_id)
);

ALTER TABLE public.wiki_article_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage wiki article groups"
  ON public.wiki_article_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

CREATE POLICY "Authenticated users can view wiki article groups"
  ON public.wiki_article_groups FOR SELECT TO authenticated
  USING (true);

-- Add indexes
CREATE INDEX idx_wiki_articles_category_id ON public.wiki_articles(category_id);
CREATE INDEX idx_wiki_article_groups_article_id ON public.wiki_article_groups(article_id);
CREATE INDEX idx_wiki_article_groups_team_id ON public.wiki_article_groups(team_id);

-- Add updated_at triggers
CREATE TRIGGER update_wiki_categories_updated_at
  BEFORE UPDATE ON public.wiki_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wiki_articles_updated_at
  BEFORE UPDATE ON public.wiki_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
