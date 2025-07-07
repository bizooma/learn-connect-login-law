
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
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { logger } from "@/utils/logger";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { isClient, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const { stats, loading: statsLoading } = useDashboardStats();

  useEffect(() => {
    logger.log('ClientDashboard: useEffect triggered with:', {
      user: !!user,
      isClient,
      roleLoading,
      userEmail: user?.email
    });

    // If no user, redirect immediately
    if (!user) {
      logger.log('ClientDashboard: No user found, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Don't redirect if we're still loading roles
    if (roleLoading) {
      logger.log('ClientDashboard: Still loading roles, waiting...');
      return;
    }

    // If user exists but is not a client, redirect
    if (user && !isClient) {
      logger.log('ClientDashboard: User is not a client, redirecting to main dashboard');
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, isClient, roleLoading, navigate]);

  // Show loading while checking role or fetching stats
  if (roleLoading || statsLoading || !user) {
    console.log('ClientDashboard: Showing loading state, roleLoading:', roleLoading, 'statsLoading:', statsLoading, 'hasUser:', !!user);
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
    console.log('ClientDashboard: User is not a client, returning null');
    return null;
  }

  console.log('ClientDashboard: Rendering dashboard for client');

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
