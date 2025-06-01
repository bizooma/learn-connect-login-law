
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, User, LogOut, Library, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseManagement from "./admin/CourseManagement";
import UserManagement from "./admin/UserManagement";
import ProfileManagement from "./admin/ProfileManagement";
import QuizManagement from "./admin/QuizManagement";
import CourseAssignmentManagement from "./admin/CourseAssignmentManagement";
import NotificationManagement from "./admin/NotificationManagement";
import NotificationBanner from "./notifications/NotificationBanner";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const adminStats = [
    {
      title: "Total Courses",
      value: stats.totalCourses.toString(),
      description: "Active courses",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      description: "Registered users",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Active Enrollments",
      value: stats.activeEnrollments.toString(),
      description: "Current enrollments",
      icon: User,
      color: "text-purple-600",
    },
    {
      title: "Total Quizzes",
      value: stats.totalQuizzes.toString(),
      description: "Available quizzes",
      icon: HelpCircle,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-white/90 mt-1">
                Welcome back, {user?.user_metadata?.first_name || "Admin"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex items-center border-white/20 bg-white text-black hover:bg-gray-100"
              >
                <Library className="h-4 w-4 mr-2" />
                Course Catalog
              </Button>
              <Button
                variant="ghost"
                onClick={signOut}
                className="flex items-center text-white/80 hover:text-white hover:bg-white/10"
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
          {adminStats.map((stat) => (
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

        {/* Management Tabs */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Management Console</CardTitle>
            <CardDescription>
              Manage courses, users, quizzes, assignments, notifications, and system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList 
                className="grid w-full grid-cols-6"
                style={{ backgroundColor: '#FFDA00' }}
              >
                <TabsTrigger 
                  value="courses"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Courses
                </TabsTrigger>
                <TabsTrigger 
                  value="assignments"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Assignments
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="quizzes"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Quizzes
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:bg-white data-[state=active]:text-black"
                  style={{ color: 'black' }}
                >
                  Profile
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses" className="mt-6">
                <CourseManagement />
              </TabsContent>
              
              <TabsContent value="assignments" className="mt-6">
                <CourseAssignmentManagement />
              </TabsContent>
              
              <TabsContent value="users" className="mt-6">
                <UserManagement />
              </TabsContent>
              
              <TabsContent value="quizzes" className="mt-6">
                <QuizManagement />
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-6">
                <NotificationManagement />
              </TabsContent>
              
              <TabsContent value="profile" className="mt-6">
                <ProfileManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
