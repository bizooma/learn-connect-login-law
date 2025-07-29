-- Function to clear refresh tokens for a specific user (admin only)
CREATE OR REPLACE FUNCTION public.admin_clear_user_tokens(p_user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Check if requester is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can clear user tokens';
  END IF;

  -- Find the user by email
  SELECT id INTO v_user_id 
  FROM public.profiles 
  WHERE email = p_user_email AND is_deleted = false;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or is deleted',
      'email', p_user_email
    );
  END IF;

  -- Log the action
  INSERT INTO public.user_management_audit (
    target_user_id,
    action_type,
    performed_by,
    reason,
    old_data
  ) VALUES (
    v_user_id,
    'clear_auth_tokens',
    auth.uid(),
    'Clear refresh tokens to resolve mobile login issues',
    jsonb_build_object(
      'user_email', p_user_email,
      'cleared_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User tokens cleared - user should try logging in again',
    'user_id', v_user_id,
    'email', p_user_email,
    'cleared_at', now()
  );
END;
$$;