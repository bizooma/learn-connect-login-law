CREATE OR REPLACE FUNCTION public.get_user_last_sign_ins()
RETURNS TABLE(user_id uuid, last_sign_in timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Non-admins simply get an empty set rather than an error, so no admin
  -- surface can hard-fail if it renders for a non-admin role.
  IF NOT public.is_admin_user() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.user_id, MAX(s.session_start) AS last_sign_in
  FROM public.user_sessions s
  WHERE s.user_id IS NOT NULL
  GROUP BY s.user_id;
END;
$function$;