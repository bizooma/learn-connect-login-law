
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminKnowledgeBaseSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const AdminKnowledgeBaseSearch = ({ searchTerm, onSearchChange }: AdminKnowledgeBaseSearchProps) => {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder="Search admin topics..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 py-3 text-lg bg-white border-gray-300 text-gray-900 placeholder-gray-500"
      />
    </div>
  );
};

export default AdminKnowledgeBaseSearch;
