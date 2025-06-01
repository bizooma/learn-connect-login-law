
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminStatsCards from "./admin/AdminStatsCards";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import NotificationBanner from "./notifications/NotificationBanner";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    activeEnrollments: 0,
    totalQuizzes: 0
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

      // For now, we'll calculate active enrollments as sum of students_enrolled
      // In the future, you might want to create an enrollments table
      const { data: coursesData } = await supabase
        .from('courses')
        .select('students_enrolled');

      const totalEnrollments = coursesData?.reduce((sum, course) => 
        sum + (course.students_enrolled || 0), 0) || 0;

      setStats({
        totalCourses: coursesCount || 0,
        totalUsers: usersCount || 0,
        activeEnrollments: totalEnrollments,
        totalQuizzes: quizzesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <AdminDashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationBanner />
        <AdminStatsCards stats={stats} />
        <AdminManagementTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default AdminDashboard;
