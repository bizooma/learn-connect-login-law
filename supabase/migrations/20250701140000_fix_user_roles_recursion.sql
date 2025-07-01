
-- Create security definer function to check user roles without recursion
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

-- Drop existing problematic policies on user_roles table
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can delete employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can insert employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update employee roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles and owners can view employee roles" ON public.user_roles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.user_roles ur ON au.id = ur.user_id
      WHERE au.id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own initial role" ON public.user_roles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update other policies that might be causing recursion
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users au
    JOIN public.user_roles ur ON au.id = ur.user_id
    WHERE au.id = auth.uid() 
    AND ur.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users au
    JOIN public.user_roles ur ON au.id = ur.user_id
    WHERE au.id = auth.uid() 
    AND ur.role = 'owner'
  );
$$;
