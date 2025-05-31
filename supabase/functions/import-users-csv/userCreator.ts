
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CSVRow, ImportError } from './types.ts';

export async function createUser(
  supabase: SupabaseClient,
  row: CSVRow
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', row.email)
      .single();

    if (existingProfile) {
      return { success: false, error: 'Email already exists' };
    }

    // Create auth user first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: row.email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: row.firstName || null,
        last_name: row.lastName || null
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return { success: false, error: `Failed to create auth user: ${authError.message}` };
    }

    if (!authUser.user) {
      return { success: false, error: 'Failed to create auth user: No user returned' };
    }

    // The profile should be created automatically by the trigger
    // But let's make sure it exists and update it if needed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUser.user.id)
      .single();

    if (!profile) {
      // If profile wasn't created by trigger, create it manually
      const { error: manualProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: row.email,
          first_name: row.firstName || null,
          last_name: row.lastName || null
        });

      if (manualProfileError) {
        console.error('Manual profile creation error:', manualProfileError);
        return { success: false, error: `Failed to create profile: ${manualProfileError.message}` };
      }
    }

    // Insert role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: row.role
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      return { success: false, error: `Failed to assign role: ${roleError.message}` };
    }

    console.log(`Successfully imported user: ${row.email}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error for user:', row.email, error);
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
