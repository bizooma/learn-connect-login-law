
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const NavigationHeader = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleLoginClick = () => {
    if (user) {
      // If user is already logged in, go to dashboard
      navigate("/dashboard");
    } else {
      // If not logged in, go to login page
      navigate("/login");
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
              alt="New Frontier University" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#home" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Home
              </a>
              <a href="/law-firm-training" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Law Firms
              </a>
              <a href="/law-firm-staff-training" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Staff Training
              </a>
              <a href="/immigration-law-training" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Immigration Law
              </a>
              <a href="#podcast" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Podcast
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              onClick={handleLoginClick}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Loading..." : user ? "Dashboard" : "Login"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;
