
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, User, Award, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardContent from "./dashboard/DashboardContent";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { isClient, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [stats, setStats] = useState({
    assignedCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificatesEarned: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      console.log('ClientDashboard: No user ID, skipping stats fetch');
      return;
    }

    try {
      console.log('ClientDashboard: Fetching stats for user:', user.id);
      setLoading(true);
      // Fetch user course progress for actual stats
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);

      const assignedCoursesCount = progressData?.length || 0;
      const completedCoursesCount = progressData?.filter(p => p.status === 'completed').length || 0;
      const inProgressCoursesCount = progressData?.filter(p => p.status === 'in_progress').length || 0;

      setStats({
        assignedCourses: assignedCoursesCount,
        completedCourses: completedCoursesCount,
        inProgressCourses: inProgressCoursesCount,
        certificatesEarned: completedCoursesCount // For now, assume 1 certificate per completed course
      });
      console.log('ClientDashboard: Stats updated successfully');
    } catch (error) {
      console.error("Error fetching client stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('ClientDashboard: useEffect triggered', {
      hasUser: !!user,
      userId: user?.id,
      isClient,
      roleLoading
    });

    // Only redirect if role loading is complete and user is NOT a client
    if (!roleLoading && user && !isClient) {
      console.log('ClientDashboard: User is not a client, redirecting to main dashboard');
      navigate("/", { replace: true });
      return;
    }

    // Fetch stats if we have a user and they are a client
    if (!roleLoading && user?.id && isClient) {
      console.log('ClientDashboard: User is a client, fetching stats');
      fetchStats();
    }
  }, [user?.id, isClient, roleLoading, navigate, fetchStats]);

  // Show loading while checking role or fetching stats
  if (roleLoading || (loading && isClient)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not a client, return null (redirect will handle navigation)
  if (!isClient) {
    return null;
  }

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
          {/* Full-width notification banner above main dashboard content */}
          <div className="mb-8">
            <NotificationBanner />
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
