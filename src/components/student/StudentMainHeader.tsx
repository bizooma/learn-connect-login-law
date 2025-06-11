
import { BookOpen, Menu, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudentMainHeader = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/', { replace: true });
    }
  };

  const handleKnowledgeBase = () => {
    navigate('/knowledge-base');
  };

  return (
    <header style={{ background: '#213C82' }} className="shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
                <p className="text-blue-100">Continue Your Learning Journey</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleKnowledgeBase} className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Knowledge Base</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentMainHeader;
