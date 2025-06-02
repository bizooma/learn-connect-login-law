
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserProgressFilterProps {
  users: UserOption[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

const UserProgressFilter = ({ users, selectedUserId, onUserChange }: UserProgressFilterProps) => {
  return (
    <Select value={selectedUserId} onValueChange={onUserChange}>
      <SelectTrigger className="w-full md:w-[250px]">
        <Users className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Filter by user" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Users</SelectItem>
        {users.map(user => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserProgressFilter;
