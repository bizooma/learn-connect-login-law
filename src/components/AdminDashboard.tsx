
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminStatsCards from "./admin/AdminStatsCards";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import NotificationBanner from "./notifications/NotificationBanner";
import RecentActivity from "./admin/RecentActivity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import GamificationDashboard from "./gamification/GamificationDashboard";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <AdminDashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationBanner />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Gamification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminStatsCards stats={stats} />
            <div className="mb-8">
              <RecentActivity />
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <AdminManagementTabs activeTab="courses" onTabChange={() => {}} />
          </TabsContent>

          <TabsContent value="users">
            <AdminManagementTabs activeTab="users" onTabChange={() => {}} />
          </TabsContent>

          <TabsContent value="progress">
            <AdminManagementTabs activeTab="progress" onTabChange={() => {}} />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminManagementTabs activeTab="notifications" onTabChange={() => {}} />
          </TabsContent>

          <TabsContent value="gamification" className="space-y-4">
            <GamificationDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
