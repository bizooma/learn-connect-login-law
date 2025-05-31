
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./user-management/UserSearch";
import UserGrid from "./user-management/UserGrid";
import DiagnosticPanel from "./user-management/DiagnosticPanel";
import UserManagementHeader from "./user-management/UserManagementHeader";
import EmptyUserState from "./user-management/EmptyUserState";
import LoadingState from "./user-management/LoadingState";
import { filterUsers } from "./user-management/userRoleUtils";
import { UserProfile, DiagnosticInfo } from "./user-management/types";
import { fetchUsersData } from "./user-management/userDataService";
import { useUserManagementOperations } from "./user-management/userManagementOperations";

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const fetchUsers = async () => {
    try {
      console.log('Fetching users data...');
      const { users: fetchedUsers, diagnosticInfo: fetchedDiagnosticInfo } = await fetchUsersData();
      console.log('Fetched users:', fetchedUsers.length);
      setUsers(fetchedUsers);
      setDiagnosticInfo(fetchedDiagnosticInfo);
      
      // Reset pagination when users data changes
      setCurrentPage(1);
      
      // Show updated role counts in a toast
      if (fetchedDiagnosticInfo) {
        const adminCount = fetchedDiagnosticInfo.roleCounts.admin || 0;
        const studentCount = fetchedDiagnosticInfo.roleCounts.student || 0;
        console.log(`Role counts updated - Admins: ${adminCount}, Students: ${studentCount}`);
      }
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

  const { cleanupOrphanedRoles, createMissingProfiles, updateUserRole } = useUserManagementOperations(fetchUsers);

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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader usersCount={users.length} diagnosticInfo={diagnosticInfo} />

      <DiagnosticPanel
        diagnosticInfo={diagnosticInfo}
        isAdmin={isAdmin}
        isCleaningUp={isCleaningUp}
        onCleanupOrphanedRoles={() => cleanupOrphanedRoles(setIsCleaningUp)}
        onCreateMissingProfiles={createMissingProfiles}
      />
      
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />
      
      <UserGrid 
        users={paginatedUsers}
        onRoleUpdate={updateUserRole}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={filteredUsers.length}
        onPageChange={handlePageChange}
        hasNextPage={currentPage < totalPages}
        hasPreviousPage={currentPage > 1}
      />
      
      {users.length === 0 && (
        <EmptyUserState 
          diagnosticInfo={diagnosticInfo}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;
