
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreateUserRequest } from './validation.ts';

export function generateTempPassword(): string {
  return `TempPass${Math.random().toString(36).slice(-8)}!${Math.floor(Math.random() * 100)}`;
}

export async function createUserAccount(userData: CreateUserRequest) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Use provided password or generate a temporary one
  const password = userData.password || generateTempPassword();

  // Create user in auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      first_name: userData.firstName,
      last_name: userData.lastName
    }
  });

  if (authError) {
    console.error('Auth creation error:', authError);
    return {
      success: false,
      error: `Failed to create user: ${authError.message}`
    };
  }

  if (!authData.user) {
    console.error('User creation failed - no user data returned');
    return {
      success: false,
      error: 'User creation failed - no user data returned'
    };
  }

  console.log('Auth user created successfully:', authData.user.id);

  // Create profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName
    });

  if (profileError) {
    console.error('Profile creation error:', profileError);
    // Don't throw here as the user was created, just log the error
  } else {
    console.log('Profile created successfully');
  }

  return {
    success: true,
    userId: authData.user.id,
    tempPassword: password,
    email: userData.email
  };
}
