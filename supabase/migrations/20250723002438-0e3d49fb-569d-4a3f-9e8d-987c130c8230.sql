-- Fix the user role insertion policy to work with upserts
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE POLICY "Users can manage their own role" 
ON public.user_roles 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());