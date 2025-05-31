
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./user-management/UserSearch";
import UserGrid from "./user-management/UserGrid";
import DiagnosticPanel from "./user-management/DiagnosticPanel";
import { filterUsers } from "./user-management/userRoleUtils";
import { UserProfile, DiagnosticInfo } from "./user-management/types";
import {
  fetchUsersData,
  cleanupOrphanedRoles as cleanupOrphanedRolesService,
  createMissingProfiles as createMissingProfilesService,
  updateUserRole as updateUserRoleService
} from "./user-management/userDataService";

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { users: fetchedUsers, diagnosticInfo: fetchedDiagnosticInfo } = await fetchUsersData();
      setUsers(fetchedUsers);
      setDiagnosticInfo(fetchedDiagnosticInfo);
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
      const deletedCount = await cleanupOrphanedRolesService();
      
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
      const createdCount = await createMissingProfilesService();

      if (createdCount === 0) {
        toast({
          title: "Info",
          description: "No missing profiles found",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Created ${createdCount} missing profiles`,
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
      // Check if current user can assign this role
      if (!isAdmin && (newRole === 'admin' || newRole === 'owner')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to assign admin or owner roles",
          variant: "destructive",
        });
        return;
      }

      await updateUserRoleService(userId, newRole);

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

      <DiagnosticPanel
        diagnosticInfo={diagnosticInfo}
        isAdmin={isAdmin}
        isCleaningUp={isCleaningUp}
        onCleanupOrphanedRoles={cleanupOrphanedRoles}
        onCreateMissingProfiles={createMissingProfiles}
      />
      
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
