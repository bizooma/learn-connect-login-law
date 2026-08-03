import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Records failed sign-in attempts so they can be diagnosed after the
// short Supabase auth-log retention window expires.
// No schema change: writes to user_activity_log with activity_type 'login'
// and metadata.success = false.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, errorCode, errorMessage } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ logged: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle();

    // Unknown email: nothing to attach the attempt to, and we don't want to
    // create a record of arbitrary addresses being probed.
    if (!profile?.id) {
      return new Response(JSON.stringify({ logged: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await admin.from('user_activity_log').insert({
      user_id: profile.id,
      activity_type: 'login',
      user_agent: req.headers.get('user-agent'),
      metadata: {
        success: false,
        error_code: errorCode ?? null,
        error_message: errorMessage ?? null,
        attempted_email: email.trim(),
        at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('log-login-attempt insert failed:', error);
      return new Response(JSON.stringify({ logged: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ logged: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('log-login-attempt error:', err);
    return new Response(JSON.stringify({ logged: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
