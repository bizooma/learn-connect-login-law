
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NavigationHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
              alt="New Frontier University" 
              className="h-12 w-auto"
            />
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">LAW FIRMS</a>
            <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">STAFF TRAINING</a>
            <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">IMMIGRATION LAW</a>
            <a href="#" className="text-gray-900 hover:text-blue-600 font-medium">PODCAST</a>
          </nav>

          {/* Login Button */}
          <Button 
            onClick={() => navigate("/login")}
            style={{ backgroundColor: '#213C82' }}
            className="hover:opacity-90 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
