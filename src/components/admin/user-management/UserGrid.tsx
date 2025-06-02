
import { UserCard } from "./UserCard";
import UserPagination from "./UserPagination";
import { UserProfile } from "./types";

interface UserGridProps {
  users: UserProfile[];
  onRoleUpdate: (userId: string, newRole: string) => Promise<void>;
  onUserDeleted: () => void;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onCourseAssigned?: () => void;
  onViewProgress?: (userId: string) => void;
}

export const UserGrid = ({ 
  users, 
  onRoleUpdate, 
  onUserDeleted, 
  currentPage, 
  totalPages, 
  totalUsers, 
  onPageChange, 
  hasNextPage, 
  hasPreviousPage,
  onCourseAssigned,
  onViewProgress 
}: UserGridProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found matching your criteria.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onRoleUpdate={onRoleUpdate}
            onUserDeleted={onUserDeleted}
            onCourseAssigned={onCourseAssigned}
            onViewProgress={onViewProgress}
          />
        ))}
      </div>

      <UserPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  );
};
