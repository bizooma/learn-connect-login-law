
CREATE TABLE public.group_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

GRANT SELECT ON public.group_managers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_managers TO authenticated;
GRANT ALL ON public.group_managers TO service_role;

ALTER TABLE public.group_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view group managers"
ON public.group_managers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage group managers"
ON public.group_managers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_group_managers_group ON public.group_managers(group_id);
CREATE INDEX idx_group_managers_user ON public.group_managers(user_id);

-- Backfill existing managers
INSERT INTO public.group_managers (group_id, user_id)
SELECT id, manager_id FROM public.groups WHERE manager_id IS NOT NULL
ON CONFLICT DO NOTHING;
