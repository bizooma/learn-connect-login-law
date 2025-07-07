
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import TeamLeaderDashboardHeader from "@/components/team-leader/TeamLeaderDashboardHeader";
import TeamLeaderDashboardTabs from "@/components/team-leader/TeamLeaderDashboardTabs";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import { useEffect } from "react";
import { logger } from "@/utils/logger";

const TeamLeaderDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isTeamLeader, loading: roleLoading } = useUserRole();

  useEffect(() => {
    // If no user, redirect immediately
    if (!user) {
      logger.log('TeamLeaderDashboard: No user found, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a team leader
    if (!roleLoading && user && !isTeamLeader) {
      logger.log('TeamLeaderDashboard: User is not a team leader, redirecting to main dashboard');
      navigate("/", { replace: true });
      return;
    }
  }, [user, isTeamLeader, roleLoading, navigate]);

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

          <TeamLeaderDashboardTabs />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default TeamLeaderDashboard;
