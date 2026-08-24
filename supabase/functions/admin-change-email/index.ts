import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailChangeRequest {
  userId: string;
  email: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with anon key for user verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Requesting user ID:', user.id);

    // Check if caller has admin role - use service role client for this check
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Error checking user roles:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error checking permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin');
    if (!isAdmin) {
      console.log('Access denied - caller is not admin. User roles:', userRoles);
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, email }: EmailChangeRequest = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if another auth user already holds this email
    // (paginate through auth users; also enforced at update time by GoTrue)
    let page = 1;
    const perPage = 1000;
    let duplicate = false;
    for (;;) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listError) {
        console.error('Error listing users for duplicate check:', listError);
        return new Response(
          JSON.stringify({ error: 'Error validating email availability' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const match = listData.users.find(
        u => u.id !== userId && u.email?.toLowerCase() === normalizedEmail
      );
      if (match) {
        duplicate = true;
        break;
      }
      if (listData.users.length < perPage) break;
      page++;
    }

    if (duplicate) {
      console.log('Email already in use by another account:', normalizedEmail);
      return new Response(
        JSON.stringify({ error: 'That email is already in use by another account.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Edge Function: Attempting to change email for user:', userId, '->', normalizedEmail);

    // Update the auth account FIRST via the Admin API so auth.identities stays consistent.
    // email_confirm: true is required — without it the new address lands unconfirmed
    // and the user may be unable to sign in.
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: normalizedEmail, email_confirm: true }
    );

    if (authUpdateError) {
      console.error('📧 Edge Function: Error updating auth email:', authUpdateError);
      const msg = authUpdateError.message?.toLowerCase().includes('already') ||
                  authUpdateError.message?.toLowerCase().includes('registered')
        ? 'That email is already in use by another account.'
        : `Failed to update login email: ${authUpdateError.message}`;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only if the auth update succeeded, sync profiles.email
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ email: normalizedEmail })
      .eq('id', userId);

    if (profileError) {
      console.error('📧 Edge Function: Auth email updated but profile sync failed:', profileError);
      return new Response(
        JSON.stringify({
          error: `The login email was changed, but syncing the profile record failed: ${profileError.message}. Re-save the same email in the Edit Email dialog to repair it.`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Edge Function: Email updated successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
