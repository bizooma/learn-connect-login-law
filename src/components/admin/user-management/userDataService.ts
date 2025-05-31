
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, DiagnosticInfo, ProfileData, OrphanedRoleData } from "./types";

// Define the auth user type structure
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
  created_at?: string;
}

interface AuthUsersResponse {
  users: AuthUser[];
}

export const fetchUsersData = async (): Promise<{
  users: UserProfile[];
  diagnosticInfo: DiagnosticInfo;
}> => {
  console.log('=== FETCHING FRESH USER DATA ===');
  console.log('Timestamp:', new Date().toISOString());
  
  // Force fresh data by adding timestamp to queries
  const timestamp = Date.now();
  
  // Get basic counts for debugging with forced refresh
  const { count: profilesCount, error: profilesCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  console.log('Profiles count query result:', { profilesCount, profilesCountError });

  const { count: rolesCount, error: rolesCountError } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true });

  console.log('Roles count query result:', { rolesCount, rolesCountError });

  // Get auth users count (this might fail with regular client)
  let authUsersCount = 0;
  try {
    const { data: authData } = await supabase.auth.admin.listUsers() as { data: AuthUsersResponse };
    authUsersCount = authData.users?.length || 0;
    console.log('Auth users count:', authUsersCount);
  } catch (authError) {
    console.log('Cannot access auth users with regular client:', authError);
  }

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

  // Get auth users to find emails for orphaned roles
  let orphanedRoleEmails: string[] = [];
  if (orphanedRoles && orphanedRoles.length > 0) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers() as { data: AuthUsersResponse };
      if (authUsers?.users) {
        const orphanedUserIds = orphanedRoles.map((r: OrphanedRoleData) => r.user_id);
        orphanedRoleEmails = authUsers.users
          .filter((user: AuthUser) => orphanedUserIds.includes(user.id))
          .map((user: AuthUser) => user.email || 'No email')
          .slice(0, 10); // Show first 10 for display
      }
    } catch (error) {
      console.log('Cannot fetch auth user emails');
    }
  }

  console.log(`=== FINAL COUNTS ===`);
  console.log(`Profiles: ${profilesCount}`);
  console.log(`Roles: ${rolesCount}`);
  console.log(`Auth users: ${authUsersCount}`);
  console.log(`Orphaned roles: ${orphanedRoles?.length || 0}`);
  console.log('Role distribution:', roleCounts);
  
  const diagnosticInfo: DiagnosticInfo = {
    profilesCount: profilesCount || 0,
    rolesCount: rolesCount || 0,
    authUsersCount,
    roleCounts,
    orphanedRolesCount: orphanedRoles?.length || 0,
    missingProfilesCount: Math.max(0, authUsersCount - (profilesCount || 0)),
    timestamp: new Date().toISOString(),
    orphanedRoleEmails
  };

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found in database');
    return { users: [], diagnosticInfo };
  }

  console.log(`Found ${profiles.length} profiles`);

  // Fetch all user roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    // Continue without roles rather than failing completely
  }

  console.log(`Found ${userRoles?.length || 0} user roles`);

  // Combine profiles with roles
  const usersWithRoles = profiles.map(profile => ({
    ...profile,
    roles: userRoles?.filter(role => role.user_id === profile.id) || []
  }));

  console.log('Users with roles:', usersWithRoles.length);
  console.log('=== END FETCH ===');
  
  return { users: usersWithRoles, diagnosticInfo };
};

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

export const createMissingProfiles = async (): Promise<number> => {
  console.log('Creating missing profiles for auth users...');
  
  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers() as { data: AuthUsersResponse };
  if (!authData?.users) {
    throw new Error('Cannot access auth users');
  }

  // Get existing profile IDs
  const { data: existingProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id');

  if (profilesError) {
    throw profilesError;
  }

  const existingProfileIds = new Set(
    (existingProfiles || []).map((p: ProfileData) => p.id)
  );
  
  // Find users without profiles
  const usersWithoutProfiles = authData.users.filter((user: AuthUser) => 
    !existingProfileIds.has(user.id)
  );

  if (usersWithoutProfiles.length === 0) {
    return 0;
  }

  // Create missing profiles
  const profilesToCreate = usersWithoutProfiles.map((user: AuthUser) => ({
    id: user.id,
    email: user.email || '',
    first_name: user.user_metadata?.first_name || '',
    last_name: user.user_metadata?.last_name || '',
    created_at: user.created_at
  }));

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(profilesToCreate);

  if (insertError) {
    throw insertError;
  }

  return profilesToCreate.length;
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
