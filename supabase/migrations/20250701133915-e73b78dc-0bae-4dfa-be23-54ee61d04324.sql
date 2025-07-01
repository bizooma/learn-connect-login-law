
-- Add RLS policies for admins to manage law firms
CREATE POLICY "Admins can manage all law firms" ON public.law_firms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
