-- 1/6 Admin-editable passing score
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS wiki_quiz_pass_percent integer NOT NULL DEFAULT 80;

ALTER TABLE public.organization_settings
  DROP CONSTRAINT IF EXISTS organization_settings_wiki_quiz_pass_percent_check;

ALTER TABLE public.organization_settings
  ADD CONSTRAINT organization_settings_wiki_quiz_pass_percent_check
  CHECK (wiki_quiz_pass_percent BETWEEN 1 AND 100);

-- 2/6 Attempt storage
CREATE TABLE IF NOT EXISTS public.wiki_quiz_attempts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id       uuid NOT NULL REFERENCES public.wiki_categories(id) ON DELETE CASCADE,
  score_percent     integer NOT NULL,
  questions_total   integer NOT NULL,
  questions_correct integer NOT NULL,
  pass_threshold    integer NOT NULL,
  passed            boolean NOT NULL,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_quiz_attempts_user     ON public.wiki_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_wiki_quiz_attempts_category ON public.wiki_quiz_attempts(category_id);

CREATE TABLE IF NOT EXISTS public.wiki_quiz_answers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          uuid NOT NULL REFERENCES public.wiki_quiz_attempts(id) ON DELETE CASCADE,
  question_id         uuid NOT NULL REFERENCES public.wiki_questions(id) ON DELETE CASCADE,
  selected_choice_ids uuid[] NOT NULL DEFAULT '{}',
  is_correct          boolean NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wiki_quiz_answers_attempt ON public.wiki_quiz_answers(attempt_id);

-- Required grants: reads are authenticated-only per RLS; writes happen only
-- through submit_wiki_quiz (SECURITY DEFINER), so no INSERT/UPDATE/DELETE grants.
GRANT SELECT ON public.wiki_quiz_attempts TO authenticated;
GRANT SELECT ON public.wiki_quiz_answers TO authenticated;
GRANT ALL ON public.wiki_quiz_attempts TO service_role;
GRANT ALL ON public.wiki_quiz_answers TO service_role;

ALTER TABLE public.wiki_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_quiz_answers  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own quiz attempts" ON public.wiki_quiz_attempts;
CREATE POLICY "Users read own quiz attempts" ON public.wiki_quiz_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own quiz answers" ON public.wiki_quiz_answers;
CREATE POLICY "Users read own quiz answers" ON public.wiki_quiz_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wiki_quiz_attempts a
    WHERE a.id = wiki_quiz_answers.attempt_id
      AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

-- 3/6 Serve the quiz WITHOUT the answers
CREATE OR REPLACE FUNCTION public.get_wiki_quiz(_category_id uuid)
RETURNS TABLE(
  question_id   uuid,
  question_text text,
  question_type text,
  sort_order    integer,
  choices       jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT COALESCE(public.can_view_wiki_category(auth.uid(), _category_id), false) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT q.id,
         q.question_text,
         q.question_type,
         q.sort_order,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object('id', c.id, 'choice_text', c.choice_text)
                            ORDER BY c.sort_order)
           FROM public.wiki_question_choices c
           WHERE c.question_id = q.id
         ), '[]'::jsonb)
  FROM public.wiki_questions q
  WHERE q.category_id = _category_id
  ORDER BY q.sort_order;
END;
$function$;

-- 4/6 Grade server-side and record the attempt
CREATE OR REPLACE FUNCTION public.submit_wiki_quiz(_category_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user       uuid := auth.uid();
  v_threshold  integer;
  v_total      integer := 0;
  v_correct    integer := 0;
  v_score      integer := 0;
  v_passed     boolean := false;
  v_attempt_id uuid;
  v_missed     uuid[] := '{}';
  r            RECORD;
  v_selected   uuid[];
  v_correct_ids uuid[];
  v_is_right   boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT COALESCE(public.can_view_wiki_category(v_user, _category_id), false) THEN
    RAISE EXCEPTION 'You do not have access to this knowledge check';
  END IF;

  SELECT wiki_quiz_pass_percent INTO v_threshold
  FROM public.organization_settings
  ORDER BY updated_at DESC LIMIT 1;
  v_threshold := COALESCE(v_threshold, 80);

  CREATE TEMP TABLE IF NOT EXISTS _graded (
    question_id uuid, selected uuid[], is_correct boolean
  ) ON COMMIT DROP;
  DELETE FROM _graded;

  FOR r IN
    SELECT q.id AS question_id
    FROM public.wiki_questions q
    WHERE q.category_id = _category_id
  LOOP
    SELECT array_agg(c.id) INTO v_correct_ids
    FROM public.wiki_question_choices c
    WHERE c.question_id = r.question_id AND c.is_correct;

    -- Ungradeable question (no correct answer authored) - skip it entirely.
    IF v_correct_ids IS NULL OR array_length(v_correct_ids, 1) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(array_agg(x::uuid), '{}'::uuid[]) INTO v_selected
    FROM jsonb_array_elements(_answers) a
    CROSS JOIN LATERAL jsonb_array_elements_text(a->'selected_choice_ids') x
    WHERE (a->>'question_id')::uuid = r.question_id;

    -- Exact set match, order-independent.
    v_is_right := (
      SELECT COALESCE(array_agg(s ORDER BY s), '{}'::uuid[]) FROM unnest(v_selected) s
    ) = (
      SELECT COALESCE(array_agg(c ORDER BY c), '{}'::uuid[]) FROM unnest(v_correct_ids) c
    );

    v_total := v_total + 1;
    IF v_is_right THEN
      v_correct := v_correct + 1;
    ELSE
      v_missed := array_append(v_missed, r.question_id);
    END IF;

    INSERT INTO _graded VALUES (r.question_id, v_selected, v_is_right);
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'This knowledge check has no gradeable questions yet';
  END IF;

  v_score  := ROUND((v_correct * 100.0) / v_total);
  v_passed := v_score >= v_threshold;

  INSERT INTO public.wiki_quiz_attempts (
    user_id, category_id, score_percent, questions_total,
    questions_correct, pass_threshold, passed
  ) VALUES (
    v_user, _category_id, v_score, v_total, v_correct, v_threshold, v_passed
  ) RETURNING id INTO v_attempt_id;

  INSERT INTO public.wiki_quiz_answers (attempt_id, question_id, selected_choice_ids, is_correct)
  SELECT v_attempt_id, question_id, selected, is_correct FROM _graded;

  RETURN jsonb_build_object(
    'attempt_id',          v_attempt_id,
    'score_percent',       v_score,
    'questions_total',     v_total,
    'questions_correct',   v_correct,
    'pass_threshold',      v_threshold,
    'passed',              v_passed,
    'missed_question_ids', COALESCE(to_jsonb(v_missed), '[]'::jsonb)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_wiki_quiz(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_wiki_quiz(uuid, jsonb) FROM anon;

-- 5/6 Stop the answers being world-readable
DROP POLICY IF EXISTS "Authenticated view wiki question choices" ON public.wiki_question_choices;

-- 6/6 The one unanswerable question (Finance Department)
UPDATE public.wiki_question_choices c
SET is_correct = true
WHERE c.choice_text = 'Finance Department'
  AND c.question_id IN (
    SELECT q.id FROM public.wiki_questions q
    JOIN public.wiki_categories wc ON wc.id = q.category_id
    WHERE wc.title = 'Conduct Detention Case Assessment'
      AND q.question_text = 'Which department must you contact first to verify client payment status?'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.wiki_question_choices c2
    WHERE c2.question_id = c.question_id AND c2.is_correct
  );