-- Add Erin Walsh to the direct admin bypass policy and create proper admin management policies
-- First, update the direct admin bypass to include Erin Walsh
DROP POLICY IF EXISTS "Direct admin bypass" ON public.user_roles;

CREATE POLICY "Direct admin bypass" ON public.user_roles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'joe@bizooma.com',
      'admin@newfrontieruniversity.com',
      'erin@bizooma.com'
    )
  );

-- Add a comprehensive admin policy for user role management
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Ensure the update_user_role_safe function can handle Erin's email
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    auth.jwt() ->> 'email' IN (
      'joe@bizooma.com',
      'admin@newfrontieruniversity.com', 
      'erin@bizooma.com'
    ) OR
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
$$;