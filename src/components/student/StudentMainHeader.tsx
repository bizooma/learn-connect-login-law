import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StudentMainHeaderProps {
  onSignOut: () => void;
}

const StudentMainHeader = ({ onSignOut }: StudentMainHeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="text-white shadow-lg" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
              alt="New Frontier University" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
              <p className="text-blue-100 text-sm">New Frontier University</p>
            </div>
          </div>

          {/* Right side - User Info and Sign Out */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-blue-100">
              Welcome, {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="text-white hover:bg-blue-700 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentMainHeader;
