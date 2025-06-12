
-- Add RLS policy to allow team leaders to view their assigned team members' course progress
CREATE POLICY "Team leaders can view assigned members course progress" 
ON public.user_course_progress 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_course_progress.user_id 
    AND profiles.team_leader_id = auth.uid()
  )
);

-- Add RLS policy to allow team leaders to view their assigned team members' course assignments
CREATE POLICY "Team leaders can view assigned members course assignments" 
ON public.course_assignments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = course_assignments.user_id 
    AND profiles.team_leader_id = auth.uid()
  )
);

-- Add RLS policy to allow team leaders to view their assigned team members' unit progress
CREATE POLICY "Team leaders can view assigned members unit progress" 
ON public.user_unit_progress 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = user_unit_progress.user_id 
    AND profiles.team_leader_id = auth.uid()
  )
);
