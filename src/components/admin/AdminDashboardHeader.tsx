
import { Button } from "@/components/ui/button";
import { LogOut, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shadow-sm border-b" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Admin Dashboard
            </h1>
            <p className="text-white/90 mt-1">
              Welcome back, {user?.user_metadata?.first_name || "Admin"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/courses")}
              className="flex items-center border-white/20 bg-white text-black hover:bg-gray-100"
            >
              <Library className="h-4 w-4 mr-2" />
              Course Catalog
            </Button>
            <Button
              variant="ghost"
              onClick={signOut}
              className="flex items-center text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
