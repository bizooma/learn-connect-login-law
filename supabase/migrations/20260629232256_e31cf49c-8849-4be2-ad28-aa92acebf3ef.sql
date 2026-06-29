
CREATE TABLE public.wiki_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.wiki_articles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL DEFAULT '',
  question_type TEXT NOT NULL DEFAULT 'single_select',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_questions TO authenticated;
GRANT ALL ON public.wiki_questions TO service_role;
ALTER TABLE public.wiki_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wiki questions" ON public.wiki_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated view wiki questions" ON public.wiki_questions FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_wiki_questions_article ON public.wiki_questions(article_id, sort_order);

CREATE TABLE public.wiki_question_choices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.wiki_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_question_choices TO authenticated;
GRANT ALL ON public.wiki_question_choices TO service_role;
ALTER TABLE public.wiki_question_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wiki question choices" ON public.wiki_question_choices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated view wiki question choices" ON public.wiki_question_choices FOR SELECT TO authenticated USING (true);
CREATE INDEX idx_wiki_question_choices_question ON public.wiki_question_choices(question_id, sort_order);

CREATE TRIGGER trg_wiki_questions_updated
  BEFORE UPDATE ON public.wiki_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
