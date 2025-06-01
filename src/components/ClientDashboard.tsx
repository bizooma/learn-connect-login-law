
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, User, Award, LogOut, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserCourseProgress from "./user/UserCourseProgress";
import NotificationBanner from "./notifications/NotificationBanner";

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { isClient } = useUserRole();
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
    if (!isClient) {
      navigate("/");
      return;
    }
    fetchStats();
  }, [isClient, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
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
      console.error("Error fetching client stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a 
                href="https://newfrontieruniversity.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img 
                  src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                  alt="New Frontier University" 
                  className="h-12 w-auto"
                />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Client Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome, {user?.user_metadata?.first_name || "Client"}! Access your assigned training materials.
                </p>
              </div>
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
          {clientStats.map((stat) => (
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
            <CardTitle>Client Learning Portal</CardTitle>
            <CardDescription>
              Access your assigned courses and track your professional development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assigned">Assigned Training</TabsTrigger>
                <TabsTrigger value="completed">Completed Training</TabsTrigger>
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

export default ClientDashboard;
