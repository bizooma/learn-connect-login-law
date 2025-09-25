-- PHASE 1: Fix affected users immediately by directly inserting the missing progress
-- This bypasses the admin function and directly fixes the data

-- Fix missing unit progress for affected users
INSERT INTO public.user_unit_progress (
  user_id,
  unit_id,
  course_id,
  completed,
  completed_at,
  completion_method,
  created_at,
  updated_at
) VALUES
-- Betel Martinez - both missing units
('b8be91e0-708f-4b45-a7e6-51aa1795e6d2', '4a2f84da-5843-4f4b-8f3b-50e22f937c65', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
('b8be91e0-708f-4b45-a7e6-51aa1795e6d2', 'bbe57d22-2ad3-4c68-9a99-14ef645dbdb6', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
-- Diana Godoy (diana.godoy3009@gmail.com) - both missing units  
('a9abfb6c-983a-4090-9569-9cedfc96bd27', '4a2f84da-5843-4f4b-8f3b-50e22f937c65', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
('a9abfb6c-983a-4090-9569-9cedfc96bd27', 'bbe57d22-2ad3-4c68-9a99-14ef645dbdb6', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
-- Diana Godoy (dianago@newfrontier.us) - both missing units
('a70bd774-631e-460f-91b5-0aaf506419f7', '4a2f84da-5843-4f4b-8f3b-50e22f937c65', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
('a70bd774-631e-460f-91b5-0aaf506419f7', 'bbe57d22-2ad3-4c68-9a99-14ef645dbdb6', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
-- Valentina Diaz - both missing units
('c9ea2c6b-2992-4467-ad09-05f8b22e952b', '4a2f84da-5843-4f4b-8f3b-50e22f937c65', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now()),
('c9ea2c6b-2992-4467-ad09-05f8b22e952b', 'bbe57d22-2ad3-4c68-9a99-14ef645dbdb6', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48', true, '2025-06-25 00:00:00+00', 'curriculum_expansion_fix', now(), now())
ON CONFLICT (user_id, unit_id, course_id) DO UPDATE SET
  completed = true,
  completed_at = COALESCE(user_unit_progress.completed_at, EXCLUDED.completed_at),
  completion_method = 'curriculum_expansion_fix',
  updated_at = now();

-- Recalculate course progress for affected users
SELECT public.update_course_progress_reliable('b8be91e0-708f-4b45-a7e6-51aa1795e6d2', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48');
SELECT public.update_course_progress_reliable('a9abfb6c-983a-4090-9569-9cedfc96bd27', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48');
SELECT public.update_course_progress_reliable('a70bd774-631e-460f-91b5-0aaf506419f7', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48');
SELECT public.update_course_progress_reliable('c9ea2c6b-2992-4467-ad09-05f8b22e952b', '12ed5d0c-f045-4abd-9135-9a4e6dc7ec48');

-- PHASE 2: Add curriculum change tracking and prevention system
CREATE TABLE IF NOT EXISTS public.curriculum_change_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  change_type TEXT NOT NULL, -- 'unit_added', 'unit_removed', 'unit_modified'
  unit_id UUID,
  changed_by UUID,
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  affected_users_count INTEGER DEFAULT 0,
  auto_grandfathered BOOLEAN DEFAULT false,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies for curriculum change audit
ALTER TABLE public.curriculum_change_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage curriculum change audit"
ON public.curriculum_change_audit
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add curriculum version tracking to lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS curriculum_version INTEGER DEFAULT 1;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS last_content_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add completion snapshot to user progress
ALTER TABLE public.user_unit_progress ADD COLUMN IF NOT EXISTS completion_curriculum_version INTEGER;