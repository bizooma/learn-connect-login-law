
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

const SimpleNavigationHeader = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 shadow-sm sticky top-0 z-50">
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
              <Link to="/" className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/law-firm-training" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                Law Firms
              </Link>
              <Link to="/law-firm-staff-training" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                Staff Training
              </Link>
              <Link to="/immigration-law-training" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                Immigration Law
              </Link>
              <a href="https://rss.com/podcasts/letsgetrich/1710197/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium">
                Podcast
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavigationHeader;
