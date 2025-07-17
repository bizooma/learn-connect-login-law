
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import TeamLeaderDashboardHeader from "@/components/team-leader/TeamLeaderDashboardHeader";
import TeamLeaderDashboardTabs from "@/components/team-leader/TeamLeaderDashboardTabs";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import IssueReportButton from "@/components/support/IssueReportButton";
import { useEffect } from "react";

const TeamLeaderDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isTeamLeader, role, loading: roleLoading } = useUserRole();

  useEffect(() => {
    console.log('TeamLeaderDashboard: useEffect triggered', { 
      authLoading, 
      roleLoading, 
      hasUser: !!user, 
      isTeamLeader, 
      role,
      userId: user?.id 
    });
    
    // CRITICAL FIX: Don't redirect during loading states - wait for everything to load first
    // This prevents the refresh redirect issue
    if (authLoading || roleLoading) {
      console.log('TeamLeaderDashboard: Still loading, waiting...', { authLoading, roleLoading });
      return;
    }

    // Only redirect if loading is complete AND user is definitely not authenticated
    if (!authLoading && !user) {
      console.log('TeamLeaderDashboard: No user found after loading complete, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a team leader
    // Add extra validation to prevent false redirects
    if (!roleLoading && user && role && !isTeamLeader) {
      console.log('TeamLeaderDashboard: User is not a team leader after loading complete', { 
        role, 
        isTeamLeader, 
        userId: user.id,
        email: user.email 
      });
      navigate("/", { replace: true });
      return;
    }
  }, [user, isTeamLeader, role, roleLoading, authLoading, navigate]);

  // Show loading state while checking authentication and role
  if (authLoading || roleLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not a team leader (redirect will happen in useEffect)
  if (!isTeamLeader) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <TeamLeaderDashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Notification Banner */}
          <NotificationBanner />
          
          <div className="mb-8 flex justify-end">
            <IssueReportButton />
          </div>

          <TeamLeaderDashboardTabs />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default TeamLeaderDashboard;
