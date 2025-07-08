-- Correct Erin Walsh's email address in admin bypass policies
-- First, update the direct admin bypass to include Erin Walsh with correct email
DROP POLICY IF EXISTS "Direct admin bypass" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

CREATE POLICY "Direct admin bypass" ON public.user_roles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'joe@bizooma.com',
      'admin@newfrontieruniversity.com',
      'erin.walsh@newfrontier.us'
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

-- Ensure the update_user_role_safe function can handle Erin's correct email
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
      'erin.walsh@newfrontier.us'
    ) OR
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
$$;