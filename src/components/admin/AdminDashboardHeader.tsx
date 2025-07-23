
import { BookOpen, Menu, LogOut, TreePine, HelpCircle, Sparkles, Map } from "lucide-react";
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
import { logger } from "@/utils/logger";
import UserCsvExport from "./UserCsvExport";

interface AdminDashboardHeaderProps {
  triggerDemo: () => void;
}

const AdminDashboardHeader = ({ triggerDemo }: AdminDashboardHeaderProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to homepage after successful sign out
      navigate('/', { replace: true });
    } catch (error) {
      logger.error('Error signing out:', error);
      // Still redirect to homepage even if there's an error
      navigate('/', { replace: true });
    }
  };

  const handleLMSTree = () => {
    navigate('/flowchart-lms-tree');
  };

  const handleKnowledgeBase = () => {
    navigate('/admin-knowledge-base');
  };

  const handleDemoWelcome = () => {
    logger.log('Demo Welcome button clicked');
    triggerDemo();
  };

  const handleRoadmap = () => {
    window.open('https://newfrontier.productlift.dev/', '_blank', 'noopener,noreferrer');
  };

  return (
    <header style={{ background: '#213C82' }} className="shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
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
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/80 text-sm">Manage New Frontier University Courses</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden">
              <UserCsvExport />
            </div>
            
            <Button
              variant="ghost"
              onClick={handleDemoWelcome}
              className="text-white hover:bg-white/10 text-sm px-3 py-2"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Demo
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white z-50">
                <DropdownMenuItem onClick={handleKnowledgeBase} className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Admin Help & Knowledge Base</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLMSTree} className="flex items-center space-x-2">
                  <TreePine className="h-4 w-4" />
                  <span>LMS Tree</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRoadmap} className="flex items-center space-x-2">
                  <Map className="h-4 w-4" />
                  <span>Roadmap</span>
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

export default AdminDashboardHeader;
