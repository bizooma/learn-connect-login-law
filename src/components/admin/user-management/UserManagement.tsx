
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./UserSearch";
import { UserGrid } from "./UserGrid";
import SimplifiedUserManagementHeader from "./SimplifiedUserManagementHeader";
import EmptyUserState from "./EmptyUserState";
import LoadingState from "./LoadingState";
import UserProgressModal from "../user-progress/UserProgressModal";
import { filterUsers } from "./userRoleUtils";
import { UserProfile } from "./types";
import { fetchUsersWithStats, SimplifiedUserStats } from "./simplifiedDataService";
import { updateUserRole as updateUserRoleService } from "./roleOperations";

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SimplifiedUserStats>({ totalUsers: 0, roleCounts: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserForProgress, setSelectedUserForProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const fetchUsers = async () => {
    try {
      console.log('Fetching users data...');
      setLoading(true);
      const { users: fetchedUsers, stats: fetchedStats } = await fetchUsersWithStats();
      console.log('Fetched users:', fetchedUsers.length);
      setUsers(fetchedUsers);
      setStats(fetchedStats);
      
      // Reset pagination when users data changes
      setCurrentPage(1);
      
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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = filterUsers(users, searchTerm);
  
  // Calculate pagination values
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      console.log(`Changed to page ${page} of ${totalPages}`);
    }
  };

  const handleViewProgress = (userId: string) => {
    setSelectedUserForProgress(userId);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <SimplifiedUserManagementHeader 
        stats={stats}
        onRefresh={fetchUsers}
      />
      
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />
      
      <UserGrid 
        users={paginatedUsers}
        onRoleUpdate={updateUserRole}
        onUserDeleted={fetchUsers}
        onCourseAssigned={fetchUsers}
        onViewProgress={handleViewProgress}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={filteredUsers.length}
        onPageChange={handlePageChange}
        hasNextPage={currentPage < totalPages}
        hasPreviousPage={currentPage > 1}
      />
      
      {users.length === 0 && (
        <EmptyUserState 
          diagnosticInfo={null}
          onRefresh={fetchUsers}
        />
      )}

      {/* User Progress Modal */}
      <UserProgressModal
        isOpen={!!selectedUserForProgress}
        onClose={() => setSelectedUserForProgress(null)}
        userId={selectedUserForProgress}
      />
    </div>
  );
};

export default UserManagement;
