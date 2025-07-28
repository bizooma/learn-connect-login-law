
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, Users, User, Library, Building2, LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardContent from "./dashboard/DashboardContent";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import Confetti from "./ui/confetti";
import WelcomeModal from "./modals/WelcomeModal";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isOwner, isStudent, isClient, isFree } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  const { stats, loading: statsLoading } = useDashboardStats();
  
  // First-time user experience
  const {
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
    triggerDemo,
  } = useFirstTimeUser();

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
  }, [isStudent, isClient, isFree, navigate]);

  const userStats = [
    {
      title: "Available Courses",
      value: statsLoading ? "..." : stats.totalCourses.toString(),
      description: "Courses to explore",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Enrolled Courses",
      value: statsLoading ? "..." : stats.assignedCourses.toString(),
      description: "Currently enrolled",
      icon: User,
      color: "text-green-600",
    },
    {
      title: "Completed",
      value: statsLoading ? "..." : stats.completedCourses.toString(),
      description: "Courses completed",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Certificates",
      value: statsLoading ? "..." : stats.certificatesEarned.toString(),
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
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                    alt="New Frontier University" 
                    className="h-12 w-auto"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Welcome back, {user?.user_metadata?.first_name || "Student"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Demo Button - Remove this in production */}
                <Button
                  variant="outline"
                  onClick={triggerDemo}
                  className="flex items-center border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Demo Welcome
                </Button>
                
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
          <DashboardStats stats={userStats} />

          {/* Main Content Tabs */}
          <DashboardContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userId={user.id}
            title="Learning Dashboard"
            description="Track your progress and continue your learning journey"
            assignedTabLabel="My Courses"
            completedTabLabel="Progress"
          />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default Dashboard;
