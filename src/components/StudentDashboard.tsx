
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, User, Award, LogOut, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserCourseProgress from "./user/UserCourseProgress";
import NotificationBanner from "./notifications/NotificationBanner";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isStudent } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [stats, setStats] = useState({
    assignedCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    certificatesEarned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStudent) {
      navigate("/");
      return;
    }
    fetchStats();
  }, [isStudent, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch user course progress for actual stats
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user?.id);

      const assignedCoursesCount = progressData?.length || 0;
      const completedCoursesCount = progressData?.filter(p => p.status === 'completed').length || 0;
      const inProgressCoursesCount = progressData?.filter(p => p.status === 'in_progress').length || 0;

      setStats({
        assignedCourses: assignedCoursesCount,
        completedCourses: completedCoursesCount,
        inProgressCourses: inProgressCoursesCount,
        certificatesEarned: completedCoursesCount // For now, assume 1 certificate per completed course
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return null;
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.user_metadata?.first_name || "Student"}! Continue your learning journey.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Banner */}
        <NotificationBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {studentStats.map((stat) => (
            <Card key={stat.title} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>My Learning Dashboard</CardTitle>
            <CardDescription>
              Track your assigned courses and learning progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assigned">Assigned Courses</TabsTrigger>
                <TabsTrigger value="completed">Completed Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assigned" className="mt-6">
                <UserCourseProgress userId={user.id} showOnlyAssigned={true} />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-6">
                <UserCourseProgress userId={user.id} showOnlyCompleted={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
