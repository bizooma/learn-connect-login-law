
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const UserSearch = ({ searchTerm, onSearchChange }: UserSearchProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => {
            console.log('🔍 UserSearch input onChange:', e.target.value);
            onSearchChange(e.target.value);
          }}
          className="pl-10"
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
        />
      </div>
    </div>
  );
};

export default UserSearch;
