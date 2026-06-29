
CREATE TABLE IF NOT EXISTS public.user_wiki_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  streak_start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_wiki_streaks TO authenticated;
GRANT ALL ON public.user_wiki_streaks TO service_role;

ALTER TABLE public.user_wiki_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wiki streak"
ON public.user_wiki_streaks FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System upserts wiki streaks"
ON public.user_wiki_streaks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System updates wiki streaks"
ON public.user_wiki_streaks FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_wiki_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_last date;
  v_current integer;
  v_longest integer;
  v_start date;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak, streak_start_date
    INTO v_last, v_current, v_longest, v_start
  FROM public.user_wiki_streaks WHERE user_id = p_user_id;

  IF v_last IS NULL THEN
    INSERT INTO public.user_wiki_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date)
    VALUES (p_user_id, 1, 1, v_today, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  IF v_last = v_today THEN
    RETURN; -- already counted today
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    v_current := v_current + 1;
  ELSE
    v_current := 1;
    v_start := v_today;
  END IF;

  v_longest := GREATEST(v_longest, v_current);

  UPDATE public.user_wiki_streaks
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_activity_date = v_today,
      streak_start_date = COALESCE(v_start, streak_start_date),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_wiki_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.update_wiki_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wiki_view_streak_trigger ON public.wiki_article_views;
CREATE TRIGGER wiki_view_streak_trigger
AFTER INSERT ON public.wiki_article_views
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_wiki_streak();

CREATE OR REPLACE FUNCTION public.update_wiki_streaks_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS user_wiki_streaks_updated_at ON public.user_wiki_streaks;
CREATE TRIGGER user_wiki_streaks_updated_at
BEFORE UPDATE ON public.user_wiki_streaks
FOR EACH ROW EXECUTE FUNCTION public.update_wiki_streaks_updated_at();
