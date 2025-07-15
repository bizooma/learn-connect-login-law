
import { Button } from "@/components/ui/button";
import { Building2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

type LawFirm = Tables<'law_firms'>;

interface OwnerDashboardHeaderProps {
  lawFirm: LawFirm | null;
}

const OwnerDashboardHeader = ({ lawFirm }: OwnerDashboardHeaderProps) => {
  const { signOut } = useAuth();

  return (
    <div>
      {/* Main NFU Header - Keep unchanged */}
      <div style={{ background: '#213C82' }} className="shadow-sm">
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
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Owner Dashboard</h1>
                  <p className="text-white/90 mt-1">
                    {lawFirm ? `Managing ${lawFirm.name}` : "Manage your law firm and employees"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {lawFirm && (
                <div className="text-sm text-white/80">
                  {lawFirm.used_seats}/{lawFirm.total_seats} seats used
                </div>
              )}
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Law Firm Branding Header - New white section */}
      {lawFirm && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Law Firm Logo */}
                <div className="flex-shrink-0">
                  {lawFirm.logo_url ? (
                    <img 
                      src={lawFirm.logo_url} 
                      alt={`${lawFirm.name} logo`}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Law Firm Name */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{lawFirm.name}</h2>
                  <p className="text-gray-600">Law Firm Dashboard</p>
                </div>
              </div>
              
              {/* Removed Course Catalog Link */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboardHeader;
