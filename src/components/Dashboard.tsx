
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, User, LogOut, Library, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserCourseProgress from "./user/UserCourseProgress";
import NotificationBanner from "./notifications/NotificationBanner";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isOwner, isStudent, isClient, isFree } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    certificatesEarned: 0
  });

  useEffect(() => {
    // Redirect students to their dedicated dashboard
    if (isStudent) {
      navigate("/student-dashboard");
      return;
    }
    
    // Redirect clients to their dedicated dashboard
    if (isClient) {
      navigate("/client-dashboard");
      return;
    }

    // Redirect free users to their dedicated dashboard
    if (isFree) {
      navigate("/free-dashboard");
      return;
    }
    
    fetchStats();
  }, [isStudent, isClient, isFree, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // For now, we'll use placeholder values for user-specific stats
      // In the future, you might want to create actual enrollment tracking
      setStats({
        totalCourses: coursesCount || 0,
        enrolledCourses: 0, // TODO: Implement actual enrollment tracking
        completedCourses: 0, // TODO: Implement actual completion tracking
        certificatesEarned: 0 // TODO: Implement actual certificate tracking
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const userStats = [
    {
      title: "Available Courses",
      value: stats.totalCourses.toString(),
      description: "Courses to explore",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Enrolled Courses",
      value: stats.enrolledCourses.toString(),
      description: "Currently enrolled",
      icon: User,
      color: "text-green-600",
    },
    {
      title: "Completed",
      value: stats.completedCourses.toString(),
      description: "Courses completed",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Certificates",
      value: stats.certificatesEarned.toString(),
      description: "Earned certificates",
      icon: Library,
      color: "text-orange-600",
    },
  ];

  // Don't render if user is not available or is a student/client/free user (will redirect)
  if (!user || isStudent || isClient || isFree) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.user_metadata?.first_name || "Student"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex items-center"
              >
                <Library className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
              {isOwner && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/owner-dashboard")}
                  className="flex items-center"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Owner Dashboard
                </Button>
              )}
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
          {userStats.map((stat) => (
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

        {/* Main Content Tabs */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Learning Dashboard</CardTitle>
            <CardDescription>
              Track your progress and continue your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses" className="mt-6">
                <UserCourseProgress userId={user.id} />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">Progress tracking coming soon...</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
