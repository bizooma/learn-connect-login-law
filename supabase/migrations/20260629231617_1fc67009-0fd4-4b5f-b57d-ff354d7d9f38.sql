
CREATE TABLE public.wiki_category_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, group_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_category_groups TO authenticated;
GRANT ALL ON public.wiki_category_groups TO service_role;

ALTER TABLE public.wiki_category_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view category-group shares"
ON public.wiki_category_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage category-group shares"
ON public.wiki_category_groups FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wiki_category_groups_category ON public.wiki_category_groups(category_id);
CREATE INDEX idx_wiki_category_groups_group ON public.wiki_category_groups(group_id);
