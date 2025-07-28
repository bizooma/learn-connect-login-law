
import { Search, BookOpen, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LMSTreeHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCourses: number;
}

const LMSTreeHeader = ({ searchTerm, onSearchChange, totalCourses }: LMSTreeHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="shadow-sm border-b" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">LMS Course Tree</h1>
                <p className="text-white/90">{totalCourses} courses available</p>
              </div>
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
            className="pl-10 bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default LMSTreeHeader;
