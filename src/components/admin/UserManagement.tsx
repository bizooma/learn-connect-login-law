
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./user-management/UserSearch";
import UserGrid from "./user-management/UserGrid";
import { filterUsers } from "./user-management/userRoleUtils";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  roles?: Array<{ role: string }>;
}

interface DiagnosticInfo {
  profilesCount: number;
  rolesCount: number;
  authUsersCount: number;
  roleCounts: Record<string, number>;
  orphanedRolesCount: number;
  missingProfilesCount: number;
  timestamp: string;
  orphanedRoleEmails?: string[];
}

interface ProfileData {
  id: string;
}

interface OrphanedRoleData {
  user_id: string;
  role: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isOwner } = useUserRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching all users and analyzing data inconsistencies...');
      
      // Get basic counts for debugging
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: rolesCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      // Get auth users count (this might fail with regular client)
      let authUsersCount = 0;
      try {
        const { data: authData } = await supabase.auth.admin.listUsers();
        authUsersCount = authData.users?.length || 0;
      } catch (authError) {
        console.log('Cannot access auth users with regular client');
      }

      // Get role distribution
      const { data: roleDistribution } = await supabase
        .from('user_roles')
        .select('role')
        .order('role');

      const roleCounts = roleDistribution?.reduce((acc, { role }) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get orphaned roles with email information
      const { data: orphanedRoles } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role
        `)
        .not('user_id', 'in', `(SELECT id FROM profiles)`);

      // Get auth users to find emails for orphaned roles
      let orphanedRoleEmails: string[] = [];
      if (orphanedRoles && orphanedRoles.length > 0) {
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          if (authUsers?.users) {
            const orphanedUserIds = orphanedRoles.map((r: OrphanedRoleData) => r.user_id);
            orphanedRoleEmails = authUsers.users
              .filter(user => orphanedUserIds.includes(user.id))
              .map(user => user.email || 'No email')
              .slice(0, 10); // Show first 10 for display
          }
        } catch (error) {
          console.log('Cannot fetch auth user emails');
        }
      }

      console.log(`Found ${profilesCount} profiles, ${rolesCount} user roles, ${authUsersCount} auth users`);
      console.log('Role distribution:', roleCounts);
      console.log(`Orphaned roles: ${orphanedRoles?.length || 0}`);
      
      setDiagnosticInfo({
        profilesCount: profilesCount || 0,
        rolesCount: rolesCount || 0,
        authUsersCount,
        roleCounts,
        orphanedRolesCount: orphanedRoles?.length || 0,
        missingProfilesCount: Math.max(0, authUsersCount - (profilesCount || 0)),
        timestamp: new Date().toISOString(),
        orphanedRoleEmails
      });

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
        setUsers([]);
        return;
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
      setUsers(usersWithRoles);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedRoles = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can cleanup orphaned roles",
        variant: "destructive",
      });
      return;
    }

    setIsCleaningUp(true);
    try {
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

      const deletedCount = deletedRoles?.length || 0;
      
      toast({
        title: "Success",
        description: `Cleaned up ${deletedCount} orphaned roles`,
      });

      // Refresh the data
      await fetchUsers();
    } catch (error: any) {
      console.error('Error cleaning up orphaned roles:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup orphaned roles",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const createMissingProfiles = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can create missing profiles",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating missing profiles for auth users...');
      
      // Get all auth users
      const { data: authData } = await supabase.auth.admin.listUsers();
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

      const existingProfileIds = new Set((existingProfiles || []).map((p: ProfileData) => p.id));
      
      // Find users without profiles
      const usersWithoutProfiles = authData.users.filter(user => 
        !existingProfileIds.has(user.id)
      );

      if (usersWithoutProfiles.length === 0) {
        toast({
          title: "Info",
          description: "No missing profiles found",
        });
        return;
      }

      // Create missing profiles
      const profilesToCreate = usersWithoutProfiles.map(user => ({
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

      toast({
        title: "Success",
        description: `Created ${profilesToCreate.length} missing profiles`,
      });

      // Refresh the data
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating missing profiles:', error);
      toast({
        title: "Error",
        description: "Failed to create missing profiles",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => {
    try {
      console.log(`Updating role for user ${userId} to ${newRole}`);
      
      // Check if current user can assign this role
      if (!isAdmin && (newRole === 'admin' || newRole === 'owner')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to assign admin or owner roles",
          variant: "destructive",
        });
        return;
      }

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

      // Refresh users list
      await fetchUsers();
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = filterUsers(users, searchTerm);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="text-sm text-gray-600">
          <div>{users.length} users loaded</div>
          {diagnosticInfo && (
            <div className="text-xs text-gray-500 mt-1">
              DB: {diagnosticInfo.profilesCount} profiles, {diagnosticInfo.rolesCount} roles
              {diagnosticInfo.authUsersCount > 0 && `, ${diagnosticInfo.authUsersCount} auth users`}
            </div>
          )}
        </div>
      </div>

      {/* Data Analysis Panel */}
      {diagnosticInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📊 Database Analysis</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-medium">Profiles: {diagnosticInfo.profilesCount}</p>
                <p className="font-medium">Roles: {diagnosticInfo.rolesCount}</p>
                <p className="font-medium">Auth Users: {diagnosticInfo.authUsersCount}</p>
              </div>
              <div>
                <p className="font-medium">Role Distribution:</p>
                {Object.entries(diagnosticInfo.roleCounts).map(([role, count]) => (
                  <p key={role} className="text-xs">• {role}: {count}</p>
                ))}
              </div>
              <div>
                <p className="font-medium">Issues Found:</p>
                <p className="text-xs">• Orphaned roles: {diagnosticInfo.orphanedRolesCount}</p>
                <p className="text-xs">• Missing profiles: {diagnosticInfo.missingProfilesCount}</p>
              </div>
            </div>
            
            {diagnosticInfo.orphanedRolesCount > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 font-medium">⚠️ Found {diagnosticInfo.orphanedRolesCount} orphaned roles</p>
                <p className="text-xs text-red-500 mt-1">These are roles assigned to users that don't have profile records</p>
                {diagnosticInfo.orphanedRoleEmails && diagnosticInfo.orphanedRoleEmails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">Sample orphaned user emails:</p>
                    <p className="text-xs">{diagnosticInfo.orphanedRoleEmails.join(', ')}</p>
                  </div>
                )}
                {isAdmin && (
                  <button 
                    onClick={cleanupOrphanedRoles}
                    disabled={isCleaningUp}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isCleaningUp ? 'Cleaning...' : 'Cleanup Orphaned Roles'}
                  </button>
                )}
              </div>
            )}

            {diagnosticInfo.missingProfilesCount > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-600 font-medium">ℹ️ Found {diagnosticInfo.missingProfilesCount} users without profiles</p>
                <p className="text-xs text-blue-500 mt-1">These are auth users that don't have corresponding profile records</p>
                {isAdmin && (
                  <button 
                    onClick={createMissingProfiles}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Create Missing Profiles
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />
      
      <UserGrid 
        users={filteredUsers} 
        onRoleUpdate={updateUserRole} 
      />
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No users found in the database</p>
          {diagnosticInfo && (
            <div className="text-xs text-gray-400 mb-4">
              Database shows {diagnosticInfo.profilesCount} profiles and {diagnosticInfo.rolesCount} roles
              <br />
              {diagnosticInfo.authUsersCount} auth users detected
            </div>
          )}
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
