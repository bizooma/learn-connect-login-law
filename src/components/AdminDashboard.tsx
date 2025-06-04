
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminStatsCards from "./admin/AdminStatsCards";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import NotificationBanner from "./notifications/NotificationBanner";
import RecentActivity from "./admin/RecentActivity";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    activeEnrollments: 0,
    totalQuizzes: 0,
    completedCourses: 0,
    averageProgress: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total quizzes
      const { count: quizzesCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });

      // Fetch user course progress data
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('status, progress_percentage');

      const totalEnrollments = progressData?.length || 0;
      const completedCourses = progressData?.filter(p => p.status === 'completed').length || 0;
      
      // Calculate average progress across all enrollments
      const totalProgress = progressData?.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) || 0;
      const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;

      setStats({
        totalCourses: coursesCount || 0,
        totalUsers: usersCount || 0,
        activeEnrollments: totalEnrollments,
        totalQuizzes: quizzesCount || 0,
        completedCourses,
        averageProgress
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      <div className="flex-1">
        <AdminDashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Full-width notification banner above main dashboard content */}
          <div className="mb-8">
            <NotificationBanner />
          </div>
          
          <AdminStatsCards stats={stats} />
          
          <div className="mb-8">
            <RecentActivity />
          </div>
          
          <AdminManagementTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default AdminDashboard;
