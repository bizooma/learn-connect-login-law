-- Create debug function to check auth state
CREATE OR REPLACE FUNCTION public.debug_auth_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_email', auth.jwt() ->> 'email',
    'auth_role', auth.jwt() ->> 'role',
    'session_exists', CASE WHEN auth.uid() IS NOT NULL THEN true ELSE false END,
    'timestamp', now()
  );
END;
$function$