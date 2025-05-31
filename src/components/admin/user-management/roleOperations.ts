
import { supabase } from "@/integrations/supabase/client";

export const cleanupOrphanedRoles = async (): Promise<number> => {
  console.log('Cleaning up orphaned roles...');
  
  // Delete roles that don't have corresponding profiles
  const { data: deletedRoles, error } = await supabase
    .from('user_roles')
    .delete()
    .not('user_id', 'in', `(SELECT id FROM profiles)`)
    .select('user_id, role');

  if (error) {
    console.error('Error cleaning up orphaned roles:', error);
    throw error;
  }

  return deletedRoles?.length || 0;
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free'): Promise<void> => {
  console.log(`Updating role for user ${userId} to ${newRole}`);
  
  // First, remove existing roles for this user
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting existing roles:', deleteError);
    throw deleteError;
  }

  // Then add the new role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: newRole });

  if (insertError) {
    console.error('Error inserting new role:', insertError);
    throw insertError;
  }
};
