
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, OrphanedRoleData } from "./types";

export const fetchBasicCounts = async () => {
  console.log('=== FETCHING FRESH USER DATA ===');
  console.log('Timestamp:', new Date().toISOString());
  
  // Get basic counts for debugging with forced refresh
  const { count: profilesCount, error: profilesCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('Profiles count query result:', { profilesCount, profilesCountError });

  const { count: rolesCount, error: rolesCountError } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  console.log('Roles count query result:', { rolesCount, rolesCountError });

  return {
    profilesCount: profilesCount || 0,
    rolesCount: rolesCount || 0,
    profilesCountError,
    rolesCountError
  };
};

export const fetchRoleDistribution = async () => {
  // Get role distribution with detailed logging
  const { data: roleDistribution, error: roleDistError } = await supabase
    .from('user_roles')
    .select('role')
    .order('role');

  console.log('Role distribution query:', { 
    data: roleDistribution, 
    error: roleDistError,
    count: roleDistribution?.length 
  });

  const roleCounts = roleDistribution?.reduce((acc: Record<string, number>, { role }: { role: string }) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  console.log('Calculated role counts:', roleCounts);

  return { roleCounts, roleDistError };
};

export const fetchOrphanedRoles = async (): Promise<{ orphanedRoles: OrphanedRoleData[] | null, orphanedError: any }> => {
  // Get orphaned roles with email information
  const { data: orphanedRoles, error: orphanedError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role
    `)
    .not('user_id', 'in', `(SELECT id FROM profiles)`);

  console.log('Orphaned roles query:', { 
    data: orphanedRoles, 
    error: orphanedError,
    count: orphanedRoles?.length 
  });

  return { orphanedRoles, orphanedError };
};

export const fetchUserProfiles = async (): Promise<UserProfile[]> => {
  console.log('Starting fetchUserProfiles with JOIN approach...');
  
  try {
    // Use a proper JOIN to get profiles with their roles in a single query
    const { data: profilesWithRoles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        user_roles!inner (
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles with roles:', error);
      throw error;
    }

    console.log(`Fetched ${profilesWithRoles?.length || 0} profile records with roles`);

    if (!profilesWithRoles || profilesWithRoles.length === 0) {
      console.log('No profiles with roles found');
      return [];
    }

    // Group roles by user since the JOIN might create multiple rows per user
    const userProfilesMap = new Map<string, UserProfile>();

    profilesWithRoles.forEach((record: any) => {
      const userId = record.id;
      
      if (userProfilesMap.has(userId)) {
        // Add role to existing user
        const existingUser = userProfilesMap.get(userId)!;
        existingUser.roles.push({ role: record.user_roles.role });
      } else {
        // Create new user profile
        userProfilesMap.set(userId, {
          id: record.id,
          email: record.email,
          first_name: record.first_name || 'Unknown',
          last_name: record.last_name || 'User',
          created_at: record.created_at,
          roles: [{ role: record.user_roles.role }],
          hasCompleteProfile: true
        });
      }
    });

    const result = Array.from(userProfilesMap.values());
    
    console.log(`Returning ${result.length} unique user profiles`);
    
    // Log sample data for debugging
    if (result.length > 0) {
      const sample = result[0];
      console.log('Sample user profile:', {
        id: sample.id.substring(0, 8) + '...',
        email: sample.email,
        firstName: sample.first_name,
        lastName: sample.last_name,
        roles: sample.roles.map(r => r.role),
        hasCompleteProfile: sample.hasCompleteProfile
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in fetchUserProfiles:', error);
    throw error;
  }
};
