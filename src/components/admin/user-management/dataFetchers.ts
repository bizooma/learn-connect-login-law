
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
  console.log('Starting fetchUserProfiles...');
  
  // First, get all user roles to understand what users we should have
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .order('user_id');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    throw rolesError;
  }

  console.log(`Found ${userRoles?.length || 0} user roles`);

  if (!userRoles || userRoles.length === 0) {
    console.log('No user roles found, returning empty array');
    return [];
  }

  // Get unique user IDs who have roles
  const uniqueUserIds = [...new Set(userRoles.map(role => role.user_id))];
  console.log(`Found ${uniqueUserIds.length} unique users with roles`);

  // Fetch all profiles that correspond to users with roles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      created_at
    `)
    .in('id', uniqueUserIds)
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  console.log(`Found ${profiles?.length || 0} profiles for users with roles`);

  // Create a map of user profiles
  const userProfilesMap = new Map<string, UserProfile>();

  // Process each user who has roles
  uniqueUserIds.forEach(userId => {
    const userProfile = profiles?.find(p => p.id === userId);
    const userRolesForUser = userRoles.filter(role => role.user_id === userId);
    
    if (userProfile) {
      // User has a complete profile
      userProfilesMap.set(userId, {
        id: userProfile.id,
        email: userProfile.email,
        first_name: userProfile.first_name || 'Unknown',
        last_name: userProfile.last_name || 'User',
        created_at: userProfile.created_at,
        roles: userRolesForUser,
        hasCompleteProfile: true
      });
    } else {
      // User has roles but no profile - this should be rare after sync
      console.log(`Found user with role but no profile: ${userId}`);
      userProfilesMap.set(userId, {
        id: userId,
        email: `missing-profile-${userId.substring(0, 8)}@example.com`,
        first_name: 'Missing',
        last_name: 'Profile',
        created_at: new Date().toISOString(),
        roles: userRolesForUser,
        hasCompleteProfile: false
      });
    }
  });

  const result = Array.from(userProfilesMap.values());
  console.log(`Returning ${result.length} user profiles total`);
  console.log(`Complete profiles: ${result.filter(u => u.hasCompleteProfile).length}`);
  console.log(`Incomplete profiles: ${result.filter(u => !u.hasCompleteProfile).length}`);
  
  // Log a sample of the data to debug
  if (result.length > 0) {
    console.log('Sample user data:', {
      email: result[0].email,
      hasCompleteProfile: result[0].hasCompleteProfile,
      firstName: result[0].first_name,
      lastName: result[0].last_name
    });
  }
  
  return result;
};
