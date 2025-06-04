
import { UserProfile } from "./types";
import { supabase } from "@/integrations/supabase/client";

export interface SimplifiedUserStats {
  totalUsers: number;
  roleCounts: Record<string, number>;
}

export const fetchUsersWithStats = async (): Promise<{
  users: UserProfile[];
  stats: SimplifiedUserStats;
}> => {
  console.log('Fetching users and basic stats...');
  
  try {
    // Check current user's permissions
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user ID:', user?.id);

    // Check if current user has admin privileges
    const { data: currentUserRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id);

    console.log('Current user roles:', currentUserRoles);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, profile_image_url, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Successfully fetched ${profiles?.length || 0} profiles`);

    if (!profiles || profiles.length === 0) {
      return {
        users: [],
        stats: {
          totalUsers: 0,
          roleCounts: {}
        }
      };
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }

    console.log(`Fetched ${userRoles?.length || 0} user roles`);

    // Create a map of user_id to roles
    const rolesMap = new Map<string, string[]>();
    const roleCounts: Record<string, number> = {};
    
    userRoles?.forEach(userRole => {
      const existingRoles = rolesMap.get(userRole.user_id) || [];
      existingRoles.push(userRole.role);
      rolesMap.set(userRole.user_id, existingRoles);
      
      // Count roles
      roleCounts[userRole.role] = (roleCounts[userRole.role] || 0) + 1;
    });

    // Combine profiles with their roles
    const userProfiles: UserProfile[] = profiles.map(profile => {
      const userRolesList = rolesMap.get(profile.id) || ['free'];
      
      return {
        id: profile.id,
        email: profile.email || 'unknown@example.com',
        first_name: profile.first_name || 'Unknown',
        last_name: profile.last_name || 'User',
        profile_image_url: profile.profile_image_url || undefined,
        created_at: profile.created_at,
        roles: userRolesList,
        hasCompleteProfile: true
      };
    });

    console.log(`Returning ${userProfiles.length} user profiles`);
    console.log('Role distribution:', roleCounts);
    
    return {
      users: userProfiles,
      stats: {
        totalUsers: userProfiles.length,
        roleCounts
      }
    };
    
  } catch (error) {
    console.error('Error in fetchUsersWithStats:', error);
    throw error;
  }
};
