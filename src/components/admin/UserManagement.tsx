
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

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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

      // Check for orphaned roles (roles without profiles)
      const { data: orphanedRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .not('user_id', 'in', `(SELECT id FROM profiles)`);

      console.log(`Found ${profilesCount} profiles, ${rolesCount} user roles, ${authUsersCount} auth users`);
      console.log('Role distribution:', roleCounts);
      console.log(`Orphaned roles: ${orphanedRoles?.length || 0}`);
      
      setDebugInfo({
        profilesCount,
        rolesCount,
        authUsersCount,
        roleCounts,
        orphanedRolesCount: orphanedRoles?.length || 0,
        timestamp: new Date().toISOString()
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
      
    } catch (error) {
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

    try {
      console.log('Cleaning up orphaned roles...');
      
      // Delete roles that don't have corresponding profiles
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`);

      if (error) {
        console.error('Error cleaning up orphaned roles:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Orphaned roles have been cleaned up",
      });

      // Refresh the data
      await fetchUsers();
    } catch (error) {
      console.error('Error cleaning up orphaned roles:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup orphaned roles",
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
    } catch (error) {
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
          {debugInfo && (
            <div className="text-xs text-gray-500 mt-1">
              DB: {debugInfo.profilesCount} profiles, {debugInfo.rolesCount} roles
              {debugInfo.authUsersCount > 0 && `, ${debugInfo.authUsersCount} auth users`}
            </div>
          )}
        </div>
      </div>

      {/* Data Analysis Panel */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Data Analysis</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>Profiles: {debugInfo.profilesCount} | Roles: {debugInfo.rolesCount} | Auth Users: {debugInfo.authUsersCount}</p>
            <p>Role Distribution: {Object.entries(debugInfo.roleCounts).map(([role, count]) => `${role}: ${count}`).join(', ')}</p>
            {debugInfo.orphanedRolesCount > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-medium">⚠️ Found {debugInfo.orphanedRolesCount} orphaned roles (roles without profiles)</p>
                {isAdmin && (
                  <button 
                    onClick={cleanupOrphanedRoles}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Cleanup Orphaned Roles
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
          {debugInfo && (
            <p className="text-xs text-gray-400 mb-4">
              Database shows {debugInfo.profilesCount} profiles and {debugInfo.rolesCount} roles
            </p>
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
