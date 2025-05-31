
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
  // First, fetch all user roles to get the complete list of users
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .order('user_id');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    throw rolesError;
  }

  if (!userRoles || userRoles.length === 0) {
    console.log('No user roles found in database');
    return [];
  }

  console.log(`Found ${userRoles.length} user roles`);

  // Get unique user IDs from roles
  const uniqueUserIds = [...new Set(userRoles.map(role => role.user_id))];
  console.log(`Found ${uniqueUserIds.length} unique users with roles`);

  // Fetch profiles for these users
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
    // Don't throw here, continue with empty profiles
  }

  console.log(`Found ${profiles?.length || 0} profiles for users with roles`);

  // Create user profiles, using role data as primary source
  const userProfilesMap = new Map<string, UserProfile>();

  // First, create entries for all users with roles
  uniqueUserIds.forEach(userId => {
    const existingProfile = profiles?.find(p => p.id === userId);
    
    userProfilesMap.set(userId, {
      id: userId,
      email: existingProfile?.email || `user-${userId.substring(0, 8)}@unknown.com`,
      first_name: existingProfile?.first_name || 'Unknown',
      last_name: existingProfile?.last_name || 'User',
      created_at: existingProfile?.created_at || new Date().toISOString(),
      roles: userRoles.filter(role => role.user_id === userId)
    });
  });

  const result = Array.from(userProfilesMap.values());
  console.log(`Returning ${result.length} user profiles (including users without profile records)`);
  
  return result;
};
