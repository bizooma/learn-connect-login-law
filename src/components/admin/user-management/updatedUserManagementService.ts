import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";
import { logger } from "@/utils/logger";

export const fetchUsersWithStatsSafe = async () => {
  logger.log('Fetching users with safe filters...');
  
  try {
    // Fetch only active users (non-deleted)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_deleted', false) // Only fetch non-deleted users
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Get roles for all users
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

    // Create a map of user roles
    const rolesMap = new Map();
    userRoles.forEach(role => {
      if (!rolesMap.has(role.user_id)) {
        rolesMap.set(role.user_id, []);
      }
      rolesMap.get(role.user_id).push(role.role);
    });

    // Combine profiles with roles
    const users = profiles.map(profile => ({
      ...profile,
      roles: rolesMap.get(profile.id) || [],
      hasCompleteProfile: true
    }));

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      roleCounts: userRoles.reduce((acc, role) => {
        acc[role.role] = (acc[role.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    logger.log('Fetched users safely:', { userCount: users.length, stats });
    
    return { users, stats };
  } catch (error) {
    logger.error('Error in fetchUsersWithStatsSafe:', error);
    throw error;
  }
};

export const updateUserRoleSafe = async (
  userId: string, 
  newRole: 'admin' | 'owner' | 'student' | 'client' | 'free' | 'team_leader', 
  reason: string
) => {
  const { data, error } = await supabase.rpc('update_user_role_safe', {
    p_user_id: userId,
    p_new_role: newRole,
    p_reason: reason
  });

  if (error) {
    logger.error('Error updating user role:', error);
    throw new Error(error.message || 'Failed to update user role');
  }

  return data;
};

export const softDeleteUserSafe = async (userId: string, reason: string) => {
  try {
    logger.log(`Safely soft deleting user ${userId}`);
    
    const { data, error } = await supabase.rpc('soft_delete_user', {
      p_user_id: userId,
      p_reason: reason
    });

    if (error) {
      logger.error('Error in safe soft delete:', error);
      throw error;
    }

    logger.log('Safe soft delete successful:', data);
    return data;
  } catch (error) {
    logger.error('Error in softDeleteUserSafe:', error);
    throw error;
  }
};

export const restoreUserSafe = async (userId: string, reason: string) => {
  try {
    logger.log(`Safely restoring user ${userId}`);
    
    const { data, error } = await supabase.rpc('restore_user', {
      p_user_id: userId,
      p_reason: reason
    });

    if (error) {
      logger.error('Error in safe restore:', error);
      throw error;
    }

    logger.log('Safe restore successful:', data);
    return data;
  } catch (error) {
    logger.error('Error in restoreUserSafe:', error);
    throw error;
  }
};
