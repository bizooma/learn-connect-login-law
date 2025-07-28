
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  userFirstName?: string;
  onSignOut: () => void;
}

const DashboardHeader = ({ title, subtitle, userFirstName, onSignOut }: DashboardHeaderProps) => {
  return (
    <div style={{ background: '#213C82' }} className="shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {title}
              </h1>
              <p className="text-white/90 mt-1">
                {subtitle.replace("{name}", userFirstName || "Student")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onSignOut}
              className="flex items-center text-white hover:bg-white/10"
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

export default DashboardHeader;
