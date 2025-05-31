
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CSVRow, ImportError } from './types.ts';

export async function createUser(
  supabase: SupabaseClient,
  row: CSVRow
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Starting import for user: ${row.email}`);

    // Check if email already exists in profiles first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', row.email)
      .single();

    if (existingProfile) {
      console.log(`Email already exists in profiles: ${row.email}`);
      return { success: false, error: 'Email already exists' };
    }

    // Check if auth user already exists
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${row.email}`
    });

    if (existingAuthUsers?.users && existingAuthUsers.users.length > 0) {
      console.log(`Auth user already exists: ${row.email}`);
      return { success: false, error: 'Email already exists' };
    }

    // Create auth user with proper metadata
    console.log(`Creating auth user for: ${row.email}`);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: row.email,
      email_confirm: true,
      user_metadata: {
        first_name: row.firstName || '',
        last_name: row.lastName || ''
      }
    });

    if (authError) {
      console.error(`Auth user creation failed for ${row.email}:`, authError);
      return { success: false, error: `Failed to create auth user: ${authError.message}` };
    }

    if (!authUser.user) {
      console.error(`No user returned from auth creation for: ${row.email}`);
      return { success: false, error: 'Failed to create auth user: No user returned' };
    }

    console.log(`Auth user created successfully for ${row.email}, ID: ${authUser.user.id}`);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if profile was created by trigger
    let profileExists = false;
    let retries = 0;
    const maxRetries = 5;

    while (!profileExists && retries < maxRetries) {
      const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.user.id)
        .single();

      if (profile) {
        profileExists = true;
        console.log(`Profile found for user: ${row.email}`);
      } else {
        retries++;
        console.log(`Profile not found for ${row.email}, retry ${retries}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // If profile wasn't created by trigger, create it manually
    if (!profileExists) {
      console.log(`Creating profile manually for: ${row.email}`);
      const { error: manualProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: row.email,
          first_name: row.firstName || null,
          last_name: row.lastName || null
        });

      if (manualProfileError) {
        console.error(`Manual profile creation failed for ${row.email}:`, manualProfileError);
        // Try to clean up the auth user
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return { success: false, error: `Failed to create profile: ${manualProfileError.message}` };
      }
      console.log(`Profile created manually for: ${row.email}`);
    }

    // Insert user role
    console.log(`Assigning role '${row.role}' to user: ${row.email}`);
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: row.role
      });

    if (roleError) {
      console.error(`Role assignment failed for ${row.email}:`, roleError);
      // Don't fail the entire import for role assignment issues
      console.log(`User ${row.email} created but role assignment failed`);
    }

    console.log(`Successfully imported user: ${row.email}`);
    return { success: true };

  } catch (error) {
    console.error(`Unexpected error for user ${row.email}:`, error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
