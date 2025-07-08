-- Fix infinite recursion in user_roles policies by simplifying admin management policy
-- The current "Admins can manage all user roles" policy is causing recursion

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- The direct admin bypass policy already handles admin access for Erin and other hardcoded admins
-- For other admins who have roles in the database, we'll create a simpler policy
-- that doesn't cause recursion by using the security definer function

-- Create a non-recursive admin management policy
CREATE POLICY "Database admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    public.is_admin_user()
  );