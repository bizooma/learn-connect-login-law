-- Update is_admin_user function to include carolina@newfrontieruniversity.com in direct admin bypass
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (
    auth.jwt() ->> 'email' IN (
      'joe@bizooma.com',
      'admin@newfrontieruniversity.com', 
      'erin.walsh@newfrontier.us',
      'carolina@newfrontieruniversity.com'
    ) OR
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
$function$