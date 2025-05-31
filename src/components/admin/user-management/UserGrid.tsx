
import UserCard from "./UserCard";
import UserPagination from "./UserPagination";
import { UserProfile } from "./types";

interface UserGridProps {
  users: UserProfile[];
  onRoleUpdate: (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => void;
  onUserDeleted: () => void;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const UserGrid = ({ 
  users, 
  onRoleUpdate,
  onUserDeleted,
  currentPage, 
  totalPages, 
  totalUsers,
  onPageChange,
  hasNextPage,
  hasPreviousPage 
}: UserGridProps) => {
  if (totalUsers === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, totalUsers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {startIndex}-{endIndex} of {totalUsers} users
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onRoleUpdate={onRoleUpdate}
            onUserDeleted={onUserDeleted}
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

export default UserGrid;
