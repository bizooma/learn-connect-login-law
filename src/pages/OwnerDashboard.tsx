
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLawFirm } from "@/hooks/useLawFirm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LawFirmSetup from "@/components/owner/LawFirmSetup";
import OwnerDashboardHeader from "@/components/owner/OwnerDashboardHeader";
import OwnerDashboardTabs from "@/components/owner/OwnerDashboardTabs";
import NotificationBanner from "@/components/notifications/NotificationBanner";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { lawFirm, loading: lawFirmLoading } = useLawFirm();

  // Show loading state while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not an owner
  if (!user || !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You need owner privileges to access this dashboard.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <OwnerDashboardHeader lawFirm={lawFirm} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Banner */}
        <NotificationBanner />

        {!lawFirm && !lawFirmLoading ? (
          // Show law firm setup if no law firm exists
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                Set Up Your Law Firm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Welcome! Let's start by setting up your law firm profile and purchasing employee seats.
              </p>
              <LawFirmSetup />
            </CardContent>
          </Card>
        ) : lawFirm ? (
          // Show main dashboard with tabs
          <OwnerDashboardTabs lawFirm={lawFirm} />
        ) : null}
      </div>
    </div>
  );
};

export default OwnerDashboard;
