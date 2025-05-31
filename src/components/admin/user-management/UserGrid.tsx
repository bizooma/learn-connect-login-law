
import UserCard from "./UserCard";
import { UserProfile } from "./types";

interface UserGridProps {
  users: UserProfile[];
  onRoleUpdate: (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => void;
}

const UserGrid = ({ users, onRoleUpdate }: UserGridProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onRoleUpdate={onRoleUpdate}
        />
      ))}
    </div>
  );
};

export default UserGrid;
