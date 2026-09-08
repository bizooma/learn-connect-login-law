
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

// Membership in this group grants Policies & Procedures access.
// Only @newfrontier.us addresses may ever be added - security boundary.
const EVERYONE_GROUP_ID = '008118df-8da5-4b7d-8fdb-998d3e86f531';

function isNfilEmail(email: string): boolean {
  return (email || '').trim().toLowerCase().endsWith('@newfrontier.us');
}

async function addToEveryoneGroup(
  supabaseAdmin: any,
  userId: string,
  email: string,
  addedBy?: string
) {
  if (!isNfilEmail(email)) return;
  const { error } = await supabaseAdmin
    .from('group_members')
    .upsert(
      { group_id: EVERYONE_GROUP_ID, user_id: userId, added_by: addedBy ?? null },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    );
  if (error) {
    // Non-blocking: the account is still valid without the group.
    console.error(`Everyone group membership failed for ${email}:`, error);
  }
}

export async function createUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userData: UserData,
  addedBy?: string
): Promise<CreateUserResult> {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // First check if user already exists in profiles table (faster check)
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingProfile) {
      console.log(`User ${userData.email} already exists in profiles`);
      return {
        success: false,
        error: 'Email already exists in profiles',
        isDuplicate: true
      };
    }

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking existing profiles:', profileCheckError);
      return {
        success: false,
        error: `Profile check failed: ${profileCheckError.message}`
      };
    }

    // Generate a temporary password if none provided
    const password = userData.password || generateRandomPassword();

    console.log(`Creating auth user for: ${userData.email}`);

    // Create user in auth.users with timeout
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
      const isDuplicate = authError.message?.toLowerCase().includes('already') || 
                          authError.message?.toLowerCase().includes('duplicate') ||
                          authError.message?.toLowerCase().includes('exists');
      
      return {
        success: false,
        error: `Auth creation failed: ${authError.message}`,
        isDuplicate
      };
    }

    if (!authData.user) {
      console.error(`No user returned from auth creation for ${userData.email}`);
      return {
        success: false,
        error: 'No user returned from auth creation'
      };
    }

    console.log(`Auth user created for ${userData.email}, ID: ${authData.user.id}`);

    // Wait a moment for the trigger to potentially fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile was created by trigger
    const { data: triggerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!triggerProfile) {
      console.log(`Profile not created by trigger for ${userData.email}, creating manually`);
      
      // Manually create profile
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
        // Still continue - the auth user was created successfully
      } else {
        console.log(`Manual profile created for ${userData.email}`);
      }
    } else {
      console.log(`Profile found for ${userData.email} (created by trigger)`);
    }

    // Assign role - normalize role values
    const normalizedRole = normalizeRole(userData.role);
    console.log(`Assigning role "${normalizedRole}" to ${userData.email}`);
    
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: authData.user.id,
        role: normalizedRole
      });

    if (roleError) {
      console.error(`Role assignment failed for ${userData.email}:`, roleError);
      // Don't fail the entire operation if role assignment fails
    } else {
      console.log(`Role ${normalizedRole} assigned to ${userData.email}`);
    }

    await addToEveryoneGroup(supabaseAdmin, authData.user.id, userData.email, addedBy);

    return {
      success: true,
      user_id: authData.user.id
    };

  } catch (error) {
    console.error(`Unexpected error creating user ${userData.email}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Unexpected error: ${errorMessage}`
    };
  }
}

function normalizeRole(role: string): string {
  if (!role || typeof role !== 'string') {
    return 'student';
  }
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Map common role variations to valid enum values
  const roleMap: Record<string, string> = {
    'admin': 'admin',
    'administrator': 'admin',
    'owner': 'admin', // Map owner to admin since owner might not be in enum
    'student': 'student',
    'user': 'student',
    'member': 'student'
  };
  
  return roleMap[normalizedRole] || 'student';
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
