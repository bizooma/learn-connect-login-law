-- Update notifications RLS policy to allow law firm owners to create notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

-- Create new policy that allows both admins and law firm owners to create notifications
CREATE POLICY "Admins and owners can manage notifications" 
ON public.notifications 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.law_firms 
    WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.law_firms 
    WHERE owner_id = auth.uid()
  )
);