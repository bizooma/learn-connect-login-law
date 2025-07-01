
-- Create a simple RPC function to get user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TABLE(role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ur.role::text
  FROM public.user_roles ur
  WHERE ur.user_id = $1
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
