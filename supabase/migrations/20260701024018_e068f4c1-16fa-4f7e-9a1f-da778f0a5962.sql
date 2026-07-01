
-- 1) wiki_page_completions
CREATE TABLE public.wiki_page_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_page_completions TO authenticated;
GRANT ALL ON public.wiki_page_completions TO service_role;

ALTER TABLE public.wiki_page_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own page completions"
  ON public.wiki_page_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins/owners read all page completions"
  ON public.wiki_page_completions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE INDEX idx_wiki_page_completions_user ON public.wiki_page_completions(user_id);
CREATE INDEX idx_wiki_page_completions_page ON public.wiki_page_completions(page_id);

-- 2) wiki_subject_progress
CREATE TABLE public.wiki_subject_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  progress_pct int NOT NULL DEFAULT 0,
  pages_completed int NOT NULL DEFAULT 0,
  pages_total int NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_subject_progress TO authenticated;
GRANT ALL ON public.wiki_subject_progress TO service_role;

ALTER TABLE public.wiki_subject_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subject progress"
  ON public.wiki_subject_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins/owners read all subject progress"
  ON public.wiki_subject_progress FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
  );

CREATE INDEX idx_wiki_subject_progress_user ON public.wiki_subject_progress(user_id);
CREATE INDEX idx_wiki_subject_progress_cat ON public.wiki_subject_progress(category_id);

-- updated_at trigger
CREATE TRIGGER trg_wiki_subject_progress_updated
BEFORE UPDATE ON public.wiki_subject_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Recompute function
CREATE OR REPLACE FUNCTION public.recompute_wiki_subject_progress(p_user_id uuid, p_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_done int;
  v_pct int;
  v_status text;
  v_completed_at timestamptz;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.wiki_pages p
  JOIN public.wiki_articles a ON a.id = p.article_id
  WHERE a.category_id = p_category_id
    AND p.is_published = true
    AND a.is_published = true;

  SELECT COUNT(*) INTO v_done
  FROM public.wiki_page_completions c
  JOIN public.wiki_pages p ON p.id = c.page_id
  JOIN public.wiki_articles a ON a.id = p.article_id
  WHERE c.user_id = p_user_id
    AND a.category_id = p_category_id
    AND p.is_published = true
    AND a.is_published = true;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::numeric / v_total) * 100)::int ELSE 0 END;
  v_status := CASE
    WHEN v_total > 0 AND v_done >= v_total THEN 'completed'
    WHEN v_done > 0 THEN 'in_progress'
    ELSE 'not_started'
  END;
  v_completed_at := CASE WHEN v_status = 'completed' THEN now() ELSE NULL END;

  INSERT INTO public.wiki_subject_progress AS wsp
    (user_id, category_id, status, progress_pct, pages_completed, pages_total,
     started_at, completed_at, last_accessed_at)
  VALUES
    (p_user_id, p_category_id, v_status, v_pct, v_done, v_total,
     CASE WHEN v_done > 0 THEN now() ELSE NULL END, v_completed_at, now())
  ON CONFLICT (user_id, category_id) DO UPDATE
  SET status = EXCLUDED.status,
      progress_pct = EXCLUDED.progress_pct,
      pages_completed = EXCLUDED.pages_completed,
      pages_total = EXCLUDED.pages_total,
      started_at = COALESCE(wsp.started_at, EXCLUDED.started_at),
      completed_at = CASE
        WHEN EXCLUDED.status = 'completed' THEN COALESCE(wsp.completed_at, EXCLUDED.completed_at)
        ELSE NULL
      END,
      last_accessed_at = now(),
      updated_at = now();
END;
$$;

-- 4) Trigger on wiki_page_completions
CREATE OR REPLACE FUNCTION public.tg_wiki_page_completion_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat uuid;
  v_user uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT a.category_id INTO v_cat
    FROM public.wiki_pages p
    JOIN public.wiki_articles a ON a.id = p.article_id
    WHERE p.id = OLD.page_id;
    v_user := OLD.user_id;
  ELSE
    SELECT a.category_id INTO v_cat
    FROM public.wiki_pages p
    JOIN public.wiki_articles a ON a.id = p.article_id
    WHERE p.id = NEW.page_id;
    v_user := NEW.user_id;
  END IF;

  IF v_cat IS NOT NULL THEN
    PERFORM public.recompute_wiki_subject_progress(v_user, v_cat);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_wiki_page_completion_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.wiki_page_completions
FOR EACH ROW EXECUTE FUNCTION public.tg_wiki_page_completion_recompute();

-- 5) RPC for frontend
CREATE OR REPLACE FUNCTION public.mark_wiki_page_complete(page_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.wiki_page_completions (user_id, page_id)
  VALUES (v_user, page_id)
  ON CONFLICT (user_id, page_id) DO UPDATE
    SET completed_at = public.wiki_page_completions.completed_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_wiki_page_complete(uuid) TO authenticated;
