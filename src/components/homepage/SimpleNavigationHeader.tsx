
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const SimpleNavigationHeader = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white hidden md:block"
            >
              Login
            </Button>
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-white hover:text-blue-400 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="text-white hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/law-firm-training" 
              className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Law Firms
            </Link>
            <Link 
              to="/law-firm-staff-training" 
              className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Staff Training
            </Link>
            <Link 
              to="/immigration-law-training" 
              className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Immigration Law
            </Link>
            <a 
              href="https://rss.com/podcasts/letsgetrich/1710197/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-300 hover:text-blue-400 block px-3 py-2 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Podcast
            </a>
            <Button 
              onClick={() => {
                handleLoginClick();
                setIsMobileMenuOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-4"
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SimpleNavigationHeader;
