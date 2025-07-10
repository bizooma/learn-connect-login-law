-- Add policy to allow law firm owners to assign roles to their employees
CREATE POLICY "Law firm owners can assign student roles to their employees" 
ON public.user_roles
FOR INSERT 
WITH CHECK (
  role = 'student' AND
  EXISTS (
    SELECT 1 
    FROM public.law_firms 
    WHERE owner_id = auth.uid() 
    AND id IN (
      SELECT law_firm_id 
      FROM public.profiles 
      WHERE id = user_roles.user_id
    )
  )
);