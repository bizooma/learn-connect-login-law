
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
  console.log('Starting fetchUserProfiles with RLS policy debugging...');
  
  try {
    // First, check current user's role to understand RLS context
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user ID:', user?.id);

    // Check if current user has admin privileges
    const { data: currentUserRoles, error: currentUserRolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id);

    console.log('Current user roles:', { 
      roles: currentUserRoles, 
      error: currentUserRolesError,
      isAdmin: currentUserRoles?.some(r => r.role === 'admin'),
      isOwner: currentUserRoles?.some(r => r.role === 'owner')
    });

    // Test the RLS functions directly
    const { data: isAdminResult, error: isAdminError } = await supabase
      .rpc('is_admin_user');
    
    const { data: isOwnerResult, error: isOwnerError } = await supabase
      .rpc('is_owner_user');

    console.log('RLS function results:', {
      isAdmin: { result: isAdminResult, error: isAdminError },
      isOwner: { result: isOwnerResult, error: isOwnerError }
    });

    // Now try to fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Successfully fetched ${profiles?.length || 0} profiles with RLS policies applied`);

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found - this might indicate RLS is blocking access');
      return [];
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

    // Create a map of user_id to roles for efficient lookup
    const rolesMap = new Map<string, Array<{ role: string }>>();
    
    userRoles?.forEach(userRole => {
      const existingRoles = rolesMap.get(userRole.user_id) || [];
      existingRoles.push({ role: userRole.role });
      rolesMap.set(userRole.user_id, existingRoles);
    });

    // Combine profiles with their roles
    const userProfiles: UserProfile[] = profiles.map(profile => {
      const userRoles = rolesMap.get(profile.id) || [{ role: 'free' }]; // Default to free if no role found
      
      return {
        id: profile.id,
        email: profile.email || 'unknown@example.com', // Fallback for null emails
        first_name: profile.first_name || 'Unknown',
        last_name: profile.last_name || 'User',
        created_at: profile.created_at,
        roles: userRoles,
        hasCompleteProfile: true
      };
    });

    console.log(`Returning ${userProfiles.length} user profiles after RLS policy application`);
    
    // Log sample data for debugging
    if (userProfiles.length > 0) {
      const sample = userProfiles[0];
      console.log('Sample user profile:', {
        id: sample.id.substring(0, 8) + '...',
        email: sample.email,
        firstName: sample.first_name,
        lastName: sample.last_name,
        roles: sample.roles.map(r => r.role),
        hasCompleteProfile: sample.hasCompleteProfile
      });
    }
    
    return userProfiles;
    
  } catch (error) {
    console.error('Error in fetchUserProfiles:', error);
    throw error;
  }
};
