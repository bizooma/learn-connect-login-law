
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search } from "lucide-react";

interface ResourcesHeaderProps {
  onUpload: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resourceCount: number;
}

const ResourcesHeader = ({ onUpload, searchTerm, onSearchChange, resourceCount }: ResourcesHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Management</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage resources for clients and free users ({resourceCount} total)
          </p>
        </div>
        
        <Button onClick={onUpload} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Resource
        </Button>
      </div>
      
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default ResourcesHeader;
