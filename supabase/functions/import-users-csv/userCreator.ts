
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password?: string;
}

interface CreateUserResult {
  success: boolean;
  user_id?: string;
  error?: string;
  isDuplicate?: boolean;
}

export async function createUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userData: UserData
): Promise<CreateUserResult> {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // First check if user already exists in auth.users
    const { data: existingAuthUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error checking existing auth users:', listError);
    } else {
      const existingAuthUser = existingAuthUsers.users?.find(u => u.email === userData.email);
      if (existingAuthUser) {
        console.log(`User ${userData.email} already exists in auth.users`);
        return {
          success: false,
          error: 'Email already exists in authentication system',
          isDuplicate: true
        };
      }
    }

    // Check if user exists in profiles table
    const { data: existingProfiles, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (!profileCheckError && existingProfiles) {
      console.log(`User ${userData.email} already exists in profiles`);
      return {
        success: false,
        error: 'Email already exists in profiles',
        isDuplicate: true
      };
    }

    // Generate a temporary password if none provided
    const password = userData.password || generateRandomPassword();

    // Create user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) {
      console.error(`Auth creation failed for ${userData.email}:`, authError);
      return {
        success: false,
        error: `Auth creation failed: ${authError.message}`,
        isDuplicate: authError.message?.includes('already') || authError.message?.includes('duplicate')
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'No user returned from auth creation'
      };
    }

    console.log(`Auth user created for ${userData.email}, ID: ${authData.user.id}`);

    // The trigger should automatically create the profile, but let's verify it exists
    let profileCreated = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!profileCreated && attempts < maxAttempts) {
      attempts++;
      
      // Wait a bit for the trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!profileError && profile) {
        profileCreated = true;
        console.log(`Profile found for ${userData.email} after ${attempts} attempts`);
      } else if (attempts === maxAttempts) {
        console.log(`Profile not found after ${maxAttempts} attempts, creating manually`);
        
        // Manually create profile if trigger didn't work
        const { error: manualProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name
          });

        if (manualProfileError) {
          console.error(`Manual profile creation failed for ${userData.email}:`, manualProfileError);
          // Don't fail the entire operation if profile creation fails
        } else {
          profileCreated = true;
          console.log(`Manual profile created for ${userData.email}`);
        }
      }
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: userData.role as any
      });

    if (roleError) {
      console.error(`Role assignment failed for ${userData.email}:`, roleError);
      // Don't fail the entire operation if role assignment fails
    } else {
      console.log(`Role ${userData.role} assigned to ${userData.email}`);
    }

    return {
      success: true,
      user_id: authData.user.id
    };

  } catch (error) {
    console.error(`Unexpected error creating user ${userData.email}:`, error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
