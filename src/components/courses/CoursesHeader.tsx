import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface CoursesHeaderProps {
  filteredCoursesCount: number;
}

const CoursesHeader = ({ filteredCoursesCount }: CoursesHeaderProps) => {
  const navigate = useNavigate();
  const { isAdmin, isOwner, isStudent, isClient, isFree } = useUserRole();

  const handleBackToDashboard = () => {
    if (isAdmin) {
      navigate("/login"); // Admin users go to the main admin dashboard
    } else if (isOwner) {
      navigate("/owner-dashboard");
    } else if (isStudent) {
      navigate("/student-dashboard");
    } else if (isClient) {
      navigate("/client-dashboard");
    } else if (isFree) {
      navigate("/free-dashboard");
    } else {
      // Default fallback
      navigate("/login");
    }
  };

  return (
    <div className="shadow-sm" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-white/10 text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <a 
              href="https://newfrontieruniversity.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto"
              />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-white">Course Catalog</h1>
              <p className="text-white/90 mt-1">
                Discover comprehensive legal education courses
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="flex items-center border-white/20 bg-white text-black hover:bg-gray-100"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-sm text-white/80">
              {filteredCoursesCount} courses available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesHeader;
