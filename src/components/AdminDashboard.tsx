
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, User, LogOut, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CourseManagement from "./admin/CourseManagement";
import UserManagement from "./admin/UserManagement";
import ProfileManagement from "./admin/ProfileManagement";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    activeEnrollments: 0
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
        activeEnrollments: totalEnrollments
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.user_metadata?.first_name || "Admin"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/courses")}
                className="flex items-center"
              >
                <Library className="h-4 w-4 mr-2" />
                Course Catalog
              </Button>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              Manage courses, users, and system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="courses">Course Management</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses" className="mt-6">
                <CourseManagement />
              </TabsContent>
              
              <TabsContent value="users" className="mt-6">
                <UserManagement />
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
