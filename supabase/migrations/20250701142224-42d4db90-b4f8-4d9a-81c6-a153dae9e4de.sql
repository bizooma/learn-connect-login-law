
-- Drop ALL existing RLS policies on user_roles table to eliminate recursion
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can delete employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can insert employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles and owners can view employee roles" ON public.user_roles;

-- Create simple, non-recursive policies
-- Users can always view their own role
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own role (for registration)
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create a direct admin bypass policy that doesn't cause recursion
-- This policy uses a direct email check instead of querying user_roles table
CREATE POLICY "Direct admin bypass" ON public.user_roles
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'joe@bizooma.com',
      'admin@newfrontieruniversity.com'
    )
  );

-- Update the security definer functions to be more robust
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create a direct admin check function that bypasses user_roles table
CREATE OR REPLACE FUNCTION public.is_direct_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.jwt() ->> 'email' IN (
    'joe@bizooma.com',
    'admin@newfrontieruniversity.com'
  );
$$;

-- Update existing admin functions to include direct admin check
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.is_direct_admin() OR
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.is_direct_admin() OR
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );
$$;
