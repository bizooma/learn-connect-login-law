
-- Add RLS policy to allow team leaders to view assigned members
CREATE POLICY "Team leaders can view assigned members" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (team_leader_id = auth.uid() AND has_role(auth.uid(), 'team_leader'));
