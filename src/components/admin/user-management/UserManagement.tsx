
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./UserSearch";
import { UserGrid } from "./UserGrid";
import DiagnosticPanel from "./DiagnosticPanel";
import UserManagementHeader from "./UserManagementHeader";
import EmptyUserState from "./EmptyUserState";
import LoadingState from "./LoadingState";
import { filterUsers } from "./userRoleUtils";
import { UserProfile, DiagnosticInfo } from "./types";
import { fetchUsersData } from "./userDataService";
import { useUserManagementOperations } from "./userManagementOperations";

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserForProgress, setSelectedUserForProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const fetchUsers = async () => {
    try {
      console.log('Fetching users data...');
      setLoading(true);
      const { users: fetchedUsers, diagnosticInfo: fetchedDiagnosticInfo } = await fetchUsersData();
      console.log('Fetched users:', fetchedUsers.length);
      setUsers(fetchedUsers);
      setDiagnosticInfo(fetchedDiagnosticInfo);
      
      // Reset pagination when users data changes
      setCurrentPage(1);
      
      // Show updated role counts in a toast only if there are actual issues
      if (fetchedDiagnosticInfo) {
        const hasIssues = fetchedDiagnosticInfo.orphanedRolesCount > 0 || fetchedDiagnosticInfo.missingProfilesCount > 0;
        if (hasIssues) {
          toast({
            title: "Database Issues Detected",
            description: `Found ${fetchedDiagnosticInfo.orphanedRolesCount} orphaned roles and ${fetchedDiagnosticInfo.missingProfilesCount} missing profiles`,
            variant: "default",
          });
        }
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

  const handleViewProgress = (userId: string) => {
    setSelectedUserForProgress(userId);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader 
        usersCount={users.length} 
        diagnosticInfo={diagnosticInfo} 
        onUserAdded={fetchUsers}
      />

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
          diagnosticInfo={diagnosticInfo}
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
