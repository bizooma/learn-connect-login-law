-- Update the INSERT policy on course_assignments to allow law firm owners
-- to assign courses to their own employees
DROP POLICY IF EXISTS "Admins can create course assignments" ON public.course_assignments;

CREATE POLICY "Admins and law firm owners can create course assignments" 
ON public.course_assignments 
FOR INSERT 
WITH CHECK (
  -- Allow admins to create any assignments
  is_admin_user() 
  OR 
  -- Allow law firm owners to create assignments for their employees only
  (
    EXISTS (
      SELECT 1 FROM public.law_firms 
      WHERE owner_id = auth.uid()
    )
    AND 
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.law_firms lf ON p.law_firm_id = lf.id
      WHERE p.id = user_id 
      AND lf.owner_id = auth.uid()
    )
  )
);