
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, User, Award, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardContent from "./dashboard/DashboardContent";
import IssueReportButton from "./support/IssueReportButton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { logger } from "@/utils/logger";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { isClient, role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const { stats, loading: statsLoading } = useDashboardStats();

  useEffect(() => {
    logger.debug('ClientDashboard: useEffect triggered', {
      user: !!user,
      isClient,
      role,
      roleLoading,
      userEmail: user?.email
    });

    // Don't redirect if we're still loading roles
    if (roleLoading) {
      logger.debug('ClientDashboard: Still loading roles, waiting...');
      return;
    }

    // If no user after role loading is complete, redirect to auth
    if (!roleLoading && !user) {
      logger.debug('ClientDashboard: No user found after role loading complete, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a client
    // Add extra validation to prevent false redirects
    if (!roleLoading && user && role && !isClient) {
      logger.debug('ClientDashboard: User is not a client after loading complete', { 
        role, 
        isClient, 
        userId: user.id,
        email: user.email 
      });
      navigate("/", { replace: true });
      return;
    }
  }, [user, isClient, role, roleLoading, navigate]);

  // Show loading while checking role or fetching stats
  if (roleLoading || statsLoading || !user) {
    logger.debug('ClientDashboard: Showing loading state', { roleLoading, statsLoading, hasUser: !!user });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not a client (redirect will happen in useEffect)
  if (!isClient) {
    logger.debug('ClientDashboard: User is not a client, returning null');
    return null;
  }

  logger.debug('ClientDashboard: Rendering dashboard for client');

  const clientStats = [
    {
      title: "Assigned Courses",
      value: stats.assignedCourses.toString(),
      description: "Courses assigned to you",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "In Progress",
      value: stats.inProgressCourses.toString(),
      description: "Currently studying",
      icon: Briefcase,
      color: "text-orange-600",
    },
    {
      title: "Completed",
      value: stats.completedCourses.toString(),
      description: "Courses completed",
      icon: Award,
      color: "text-green-600",
    },
    {
      title: "Certificates",
      value: stats.certificatesEarned.toString(),
      description: "Certificates earned",
      icon: User,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100 flex flex-col">
      <div className="flex-1">
        <DashboardHeader
          title="Client Dashboard"
          subtitle="Welcome, {name}! Access your assigned training materials."
          userFirstName={user?.user_metadata?.first_name}
          onSignOut={signOut}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationBanner />
          
          <div className="mb-8 flex justify-end">
            <IssueReportButton />
          </div>

          <DashboardStats stats={clientStats} />

          <DashboardContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userId={user.id}
            title="Client Learning Portal"
            description="Access your assigned courses and track your professional development"
            assignedTabLabel="Assigned Training"
            completedTabLabel="Completed Training"
          />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default ClientDashboard;
