
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Award, GraduationCap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardContent from "./dashboard/DashboardContent";
import StudentProfileTab from "./student/StudentProfileTab";
import StudentMainHeader from "./student/StudentMainHeader";
import StudentDashboardHeader from "./student/StudentDashboardHeader";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [mainTab, setMainTab] = useState("dashboard");
  const [stats, setStats] = useState({
    assignedCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificatesEarned: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      console.log('StudentDashboard: No user ID, skipping stats fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('StudentDashboard: Fetching stats for user:', user.id);
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
      console.log('StudentDashboard: Stats updated successfully');
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('StudentDashboard: useEffect triggered with:', {
      user: !!user,
      userId: user?.id,
      isStudent,
      roleLoading,
      userEmail: user?.email
    });

    // Only redirect if role loading is complete AND user is definitely not a student
    if (!roleLoading && user && !isStudent) {
      console.log('StudentDashboard: User is not a student, redirecting to main dashboard');
      navigate("/", { replace: true });
      return;
    }

    // If we have a student user and roles are loaded, fetch stats
    if (!roleLoading && isStudent && user?.id) {
      console.log('StudentDashboard: Student confirmed, fetching stats');
      fetchStats();
    }
  }, [user?.id, isStudent, roleLoading, navigate, fetchStats]);

  // Show loading while checking roles or fetching data
  if (roleLoading || (loading && isStudent)) {
    console.log('StudentDashboard: Showing loading state, roleLoading:', roleLoading, 'loading:', loading);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not a student (redirect will happen in useEffect)
  if (!isStudent) {
    console.log('StudentDashboard: User is not a student, returning null');
    return null;
  }

  console.log('StudentDashboard: Rendering dashboard for student');

  const studentStats = [
    {
      title: "Assigned Courses",
      value: stats.assignedCourses.toString(),
      description: "Courses assigned to you",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "In Progress",
      value: stats.inProgressCourses.toString(),
      description: "Currently studying",
      icon: GraduationCap,
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
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex flex-col">
      <StudentMainHeader onSignOut={signOut} />
      <StudentDashboardHeader />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Full-width notification banner above main dashboard content */}
          <div className="mb-8">
            <NotificationBanner />
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back! Continue your learning journey.</p>
          </div>
          
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              <DashboardStats stats={studentStats} />

              <DashboardContent
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userId={user.id}
                title="My Learning Dashboard"
                description="Track your assigned courses and learning progress"
                assignedTabLabel="Assigned Courses"
                completedTabLabel="Completed Courses"
                yellowTabs={true}
              />
            </TabsContent>

            <TabsContent value="profile">
              <StudentProfileTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default StudentDashboard;
