
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreateUserRequest } from './validation.ts';

export function resolveSiteUrl(req: Request): string {
  const configured = Deno.env.get('PUBLIC_SITE_URL');
  if (configured) return configured.replace(/\/$/, '');

  // Fall back to the caller's origin so previews keep working
  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch (_) { /* ignore */ }
  }
  return '';
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

function isAlreadyExistsError(message: string): boolean {
  const m = (message || '').toLowerCase();
  return m.includes('already been registered') ||
    m.includes('already registered') ||
    m.includes('already exists') ||
    m.includes('duplicate key');
}

export async function createUserAccount(userData: CreateUserRequest, siteUrl: string) {
  const supabaseAdmin = adminClient();
  const redirectTo = `${siteUrl}/reset-password`;

  // Creates the auth user with NO password and emails the invite in one call
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    userData.email,
    {
      redirectTo,
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
      },
    }
  );

  if (authError) {
    console.error('Invite error:', authError);
    if (isAlreadyExistsError(authError.message)) {
      return { success: false, error: 'This email already has an account' };
    }
    return { success: false, error: `Failed to invite user: ${authError.message}` };
  }

  if (!authData?.user) {
    console.error('Invite failed - no user data returned');
    return { success: false, error: 'User creation failed - no user data returned' };
  }

  console.log('Auth user invited successfully:', authData.user.id);

  // Create profile (trigger may already have created it)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile creation error:', profileError);
  } else {
    console.log('Profile created successfully');
  }

  return {
    success: true,
    userId: authData.user.id,
    email: userData.email,
  };
}

export async function resendInvite(email: string, siteUrl: string) {
  const supabaseAdmin = adminClient();
  const normalized = email.trim().toLowerCase();

  // Never delete/recreate the auth account - that would orphan progress records.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();

  if (profile?.id) {
    const { data: existing } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (existing?.user?.last_sign_in_at) {
      return {
        success: false,
        error: 'This user has already signed in. Use "Reset PWD" instead of resending an invite.',
      };
    }
  }

  // A recovery email produces the same kind of session as an invite link and
  // lands on the same /reset-password screen, so it safely re-issues access.
  // Issuing it invalidates older one-time links; the UI tells admins to have
  // the user open only the newest message.
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const { error } = await supabaseAnon.auth.resetPasswordForEmail(normalized, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    console.error('Resend invite error:', error);
    return { success: false, error: `Could not resend invite: ${error.message}` };
  }


  return { success: true, email: normalized };
}
