
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLawFirm } from "@/hooks/useLawFirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import OwnerDashboardHeader from "@/components/owner/OwnerDashboardHeader";
import OwnerDashboardTabs from "@/components/owner/OwnerDashboardTabs";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import IssueReportButton from "@/components/support/IssueReportButton";
import QuickStartModal from "@/components/owner/QuickStartModal";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isOwner, role, loading: roleLoading } = useUserRole();
  const { lawFirm, loading: lawFirmLoading, updateLawFirm } = useLawFirm();
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  useEffect(() => {
    console.log('OwnerDashboard: useEffect triggered', { 
      authLoading, 
      roleLoading, 
      hasUser: !!user, 
      isOwner, 
      role,
      userId: user?.id 
    });
    
    // CRITICAL FIX: Don't redirect during loading states - wait for everything to load first
    // This prevents the refresh redirect issue
    if (authLoading || roleLoading) {
      console.log('OwnerDashboard: Still loading, waiting...', { authLoading, roleLoading });
      return;
    }

    // Only redirect if loading is complete AND user is definitely not authenticated
    if (!authLoading && !user) {
      console.log('OwnerDashboard: No user found after loading complete, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not an owner
    // Add extra validation to prevent false redirects
    if (!roleLoading && user && role && !isOwner) {
      console.log('OwnerDashboard: User is not an owner after loading complete', { 
        role, 
        isOwner, 
        userId: user.id,
        email: user.email 
      });
      navigate("/", { replace: true });
      return;
    }
  }, [user, isOwner, role, roleLoading, authLoading, navigate]);

  // Show loading state while checking authentication and role
  if (authLoading || roleLoading || lawFirmLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not an owner (redirect will happen in useEffect)
  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="flex-1">
        <OwnerDashboardHeader lawFirm={lawFirm} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Notification Banner */}
          <NotificationBanner />
          
          <div className="mb-8 flex justify-end gap-4">
            <Button
              onClick={() => setQuickStartOpen(true)}
              style={{ backgroundColor: '#859FE0' }}
              className="hover:opacity-90 text-black shadow-md"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Quick Start
            </Button>
            <IssueReportButton />
          </div>

          {/* Show main dashboard with tabs - law firm will be auto-created if needed */}
          {lawFirm && <OwnerDashboardTabs lawFirm={lawFirm} onUpdateLawFirm={updateLawFirm} />}
        </div>
      </div>
      
      <QuickStartModal 
        open={quickStartOpen} 
        onOpenChange={setQuickStartOpen} 
      />
      
      <LMSTreeFooter />
    </div>
  );
};

export default OwnerDashboard;
