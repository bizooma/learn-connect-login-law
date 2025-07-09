
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminStatsCards from "./admin/AdminStatsCards";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import NotificationBanner from "./notifications/NotificationBanner";
import RecentActivity from "./admin/RecentActivity";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import Confetti from "./ui/confetti";
import WelcomeModal from "./modals/WelcomeModal";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { user } = useAuth();
  const {
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
    triggerDemo,
  } = useFirstTimeUser();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    activeEnrollments: 0,
    totalQuizzes: 0,
    completedCourses: 0,
    averageProgress: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🏢 AdminDashboard: Initializing...');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    console.log('📊 AdminDashboard: Fetching stats...');
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      console.log('📊 AdminDashboard: Making database queries...');
      
      // Fetch total courses with timeout protection
      const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      
      if (coursesError) {
        console.error('❌ AdminDashboard: Courses query failed:', coursesError);
        throw coursesError;
      }

      // Fetch total users with timeout protection
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (usersError) {
        console.error('❌ AdminDashboard: Users query failed:', usersError);
        throw usersError;
      }

      // Fetch total quizzes with timeout protection
      const { count: quizzesCount, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true });
        
      if (quizzesError) {
        console.error('❌ AdminDashboard: Quizzes query failed:', quizzesError);
        // Don't throw here, quizzes might not exist yet
      }

      // Try to fetch user course progress data with error handling
      let progressData = [];
      try {
        const { data, error: progressError } = await supabase
          .from('user_course_progress')
          .select('status, progress_percentage');
          
        if (progressError) {
          console.error('❌ AdminDashboard: Progress query failed:', progressError);
        } else {
          progressData = data || [];
        }
      } catch (progressErr) {
        console.error('❌ AdminDashboard: Progress query exception:', progressErr);
      }

      const totalEnrollments = progressData.length || 0;
      const completedCourses = progressData.filter(p => p.status === 'completed').length || 0;
      
      // Calculate average progress across all enrollments
      const totalProgress = progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) || 0;
      const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;

      const newStats = {
        totalCourses: coursesCount || 0,
        totalUsers: usersCount || 0,
        activeEnrollments: totalEnrollments,
        totalQuizzes: quizzesCount || 0,
        completedCourses,
        averageProgress
      };
      
      console.log('✅ AdminDashboard: Stats fetched successfully:', newStats);
      setStats(newStats);
      setStatsLoading(false);
    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching stats:', error);
      setStatsError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      setStatsLoading(false);
      
      // Set fallback stats to prevent white screen
      setStats({
        totalCourses: 0,
        totalUsers: 0,
        activeEnrollments: 0,
        totalQuizzes: 0,
        completedCourses: 0,
        averageProgress: 0
      });
    }
  };

  console.log('🎨 AdminDashboard: Rendering dashboard...', { 
    statsLoading, 
    statsError, 
    hasUser: !!user,
    showWelcome,
    showConfetti 
  });

  // Show error state if stats failed to load but still show the dashboard
  if (statsError) {
    console.warn('⚠️ AdminDashboard: Rendering with error state:', statsError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* Confetti Animation */}
      <Confetti active={showConfetti} />
      
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onClose={markWelcomeAsSeen}
        userFirstName={user?.user_metadata?.first_name}
      />

      <div className="flex-1">
        <AdminDashboardHeader triggerDemo={triggerDemo} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationBanner />
          
          {/* Show error message if stats failed */}
          {statsError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                ⚠️ Some dashboard data may not be current. Error: {statsError}
              </p>
            </div>
          )}
          
          <AdminStatsCards stats={stats} />
          
          <div className="mb-8">
            <RecentActivity />
          </div>
          
          <AdminManagementTabs />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default AdminDashboard;
