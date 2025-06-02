
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type LawFirm = Tables<'law_firms'>;

interface OwnerDashboardHeaderProps {
  lawFirm: LawFirm | null;
}

const OwnerDashboardHeader = ({ lawFirm }: OwnerDashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#213C82' }} className="shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardHeader;
