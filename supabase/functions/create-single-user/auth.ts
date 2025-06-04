
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function authenticateRequest(authHeader: string | null) {
  if (!authHeader) {
    return {
      success: false,
      error: 'Authorization header is required',
      status: 401
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
  if (userError || !user) {
    console.error('Auth error:', userError);
    return {
      success: false,
      error: 'Authentication failed - invalid or expired token',
      status: 401
    };
  }

  return {
    success: true,
    user
  };
}
