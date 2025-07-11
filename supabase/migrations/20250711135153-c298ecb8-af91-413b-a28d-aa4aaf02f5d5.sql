-- Add SELECT policy for law firm owners to view their employees' course assignments
CREATE POLICY "Law firm owners can view their employees course assignments" 
ON public.course_assignments 
FOR SELECT 
USING (
  -- Allow law firm owners to view assignments for their employees only
  EXISTS (
    SELECT 1 FROM public.law_firms 
    WHERE owner_id = auth.uid()
  )
  AND 
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.law_firms lf ON p.law_firm_id = lf.id
    WHERE p.id = course_assignments.user_id 
    AND lf.owner_id = auth.uid()
  )
);