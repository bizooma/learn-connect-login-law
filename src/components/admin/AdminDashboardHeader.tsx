
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const AdminDashboardHeader = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="text-white shadow-lg" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage New Frontier University Courses</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-white hover:bg-white/10 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/lms-tree")}
                    className="w-full justify-start"
                  >
                    LMS Tree
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
