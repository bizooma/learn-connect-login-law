
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const NavigationHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const handleLoginClick = () => {
    if (user && isAdmin) {
      // If user is already logged in and is admin, go to login page to see admin dashboard
      navigate("/login");
    } else if (user) {
      // If user is logged in but not admin, redirect based on their role
      // This will be handled by the Index component's useEffect
      navigate("/login");
    } else {
      // If no user, go to login page
      navigate("/login");
    }
  };

  return (
    <header className="bg-black shadow-sm">
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
            <a href="#" className="text-white hover:text-gray-300 font-medium">LAW FIRMS</a>
            <a href="#" className="text-white hover:text-gray-300 font-medium">STAFF TRAINING</a>
            <a href="#" className="text-white hover:text-gray-300 font-medium">IMMIGRATION LAW</a>
            <a 
              href="https://media.rss.com/letsgetrich/feed.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 font-medium"
            >
              PODCAST
            </a>
          </nav>

          {/* Login Button */}
          <Button 
            onClick={handleLoginClick}
            className="bg-white text-black hover:bg-gray-100"
          >
            {user ? (isAdmin ? 'Admin Dashboard' : 'Dashboard') : 'Login'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NavigationHeader;
