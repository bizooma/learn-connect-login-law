
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CourseSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const CourseSearch = ({ searchTerm, onSearchChange }: CourseSearchProps) => {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search courses..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default CourseSearch;
