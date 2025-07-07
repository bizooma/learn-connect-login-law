
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const cleanupOrphanedRoles = async (): Promise<number> => {
  logger.log('Cleaning up orphaned roles...');
  
  // Delete roles that don't have corresponding profiles
  const { data: deletedRoles, error } = await supabase
    .from('user_roles')
    .delete()
    .not('user_id', 'in', `(SELECT id FROM profiles)`)
    .select('user_id, role');

  if (error) {
    logger.error('Error cleaning up orphaned roles:', error);
    throw error;
  }

  return deletedRoles?.length || 0;
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free'): Promise<void> => {
  logger.log(`Updating role for user ${userId} to ${newRole}`);
  
  // First, remove existing roles for this user
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    logger.error('Error deleting existing roles:', deleteError);
    throw deleteError;
  }

  // Then add the new role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: newRole });

  if (insertError) {
    logger.error('Error inserting new role:', insertError);
    throw insertError;
  }
};
