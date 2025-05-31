
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";

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

export const fetchAuthUsersCount = async (): Promise<number> => {
  // Get auth users count (this might fail with regular client)
  let authUsersCount = 0;
  try {
    const { data: authData } = await supabase.auth.admin.listUsers() as { data: AuthUsersResponse };
    authUsersCount = authData.users?.length || 0;
    console.log('Auth users count:', authUsersCount);
  } catch (authError) {
    console.log('Cannot access auth users with regular client:', authError);
  }
  return authUsersCount;
};

export const fetchOrphanedRoleEmails = async (orphanedUserIds: string[]): Promise<string[]> => {
  // Get auth users to find emails for orphaned roles
  let orphanedRoleEmails: string[] = [];
  if (orphanedUserIds.length > 0) {
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers() as { data: AuthUsersResponse };
      if (authUsers?.users) {
        orphanedRoleEmails = authUsers.users
          .filter((user: AuthUser) => orphanedUserIds.includes(user.id))
          .map((user: AuthUser) => user.email || 'No email')
          .slice(0, 10); // Show first 10 for display
      }
    } catch (error) {
      console.log('Cannot fetch auth user emails');
    }
  }
  return orphanedRoleEmails;
};

export const createMissingProfilesFromAuth = async (): Promise<number> => {
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
