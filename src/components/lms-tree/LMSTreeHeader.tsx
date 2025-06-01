
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LMSTreeHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCourses: number;
}

const LMSTreeHeader = ({ searchTerm, onSearchChange, totalCourses }: LMSTreeHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <a 
              href="https://newfrontieruniversity.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-8 w-auto"
              />
            </a>
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LMS Course Tree</h1>
              <p className="text-sm text-gray-600">{totalCourses} courses available</p>
            </div>
          </div>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search courses, sections, or units..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};

export default LMSTreeHeader;
