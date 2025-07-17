
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, Award, GraduationCap, User, Calendar, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardContent from "./dashboard/DashboardContent";
import StudentProfileTab from "./student/StudentProfileTab";
import StudentCertificatesTab from "./student/StudentCertificatesTab";
import StudentMainHeader from "./student/StudentMainHeader";
import StudentDashboardHeader from "./student/StudentDashboardHeader";
import StudentBadgesSection from "./badges/StudentBadgesSection";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import Confetti from "./ui/confetti";
import WelcomeModal from "./modals/WelcomeModal";
import IssueReportButton from "./support/IssueReportButton";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import { logger } from "@/utils/logger";
import StudentCalendarTab from "./student/StudentCalendarTab";
import StudentDashboardErrorBoundary from "./ErrorBoundary/StudentDashboardErrorBoundary";
import StudentDashboardFallback from "./ErrorBoundary/StudentDashboardFallback";
import { RealtimeStatus } from "./debug/RealtimeStatus";
import StudentQuickStartModal from "./student/StudentQuickStartModal";
import { Button } from "@/components/ui/button";

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isStudent, role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [mainTab, setMainTab] = useState("dashboard");
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats();
  
  // First-time user experience
  const {
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
  } = useFirstTimeUser();

  useEffect(() => {
    logger.debug('StudentDashboard: useEffect triggered', {
      user: !!user,
      isStudent,
      role,
      roleLoading,
      userEmail: user?.email
    });

    // CRITICAL: Don't redirect immediately on page refresh when session might still be loading
    // Wait for role loading to complete before making redirect decisions
    if (roleLoading) {
      logger.debug('StudentDashboard: Role still loading, waiting...');
      return;
    }

    // If no user after role loading is complete, redirect to auth
    if (!roleLoading && !user) {
      logger.debug('StudentDashboard: No user found after role loading complete, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a student
    // Add extra validation to prevent false redirects
    if (!roleLoading && user && role && !isStudent) {
      logger.debug('StudentDashboard: User is not a student after loading complete', { 
        role, 
        isStudent, 
        userId: user.id,
        email: user.email 
      });
      navigate("/", { replace: true });
      return;
    }

    // If we have a user and they are a student, stay on dashboard
    if (user && isStudent) {
      logger.debug('StudentDashboard: Valid student user, staying on dashboard');
    }
  }, [isStudent, role, roleLoading, user, navigate]);

  // Show loading while checking roles - more resilient loading state
  if (roleLoading || !user) {
    logger.debug('StudentDashboard: Showing loading state', { roleLoading, hasUser: !!user });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show fallback if stats are still loading but we can show basic UI
  if (statsLoading && user && isStudent) {
    return <StudentDashboardFallback onRetry={refetchStats} />;
  }

  // Don't render anything if user is not a student (redirect will happen in useEffect)
  if (!isStudent) {
    logger.debug('StudentDashboard: User is not a student, returning null');
    return null;
  }

  logger.debug('StudentDashboard: Rendering dashboard for student');

  const studentStats = [
    {
      title: "Assigned Courses",
      value: (stats?.assignedCourses ?? 0).toString(),
      description: "Courses assigned to you",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "In Progress",
      value: (stats?.inProgressCourses ?? 0).toString(),
      description: "Currently studying",
      icon: GraduationCap,
      color: "text-orange-600",
    },
    {
      title: "Completed",
      value: (stats?.completedCourses ?? 0).toString(),
      description: "Courses completed",
      icon: Award,
      color: "text-green-600",
    },
    {
      title: "Certificates",
      value: (stats?.certificatesEarned ?? 0).toString(),
      description: "Certificates earned",
      icon: User,
      color: "text-purple-600",
    },
  ];

  return (
    <StudentDashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex flex-col">
      {/* Confetti Animation */}
      <Confetti active={showConfetti} />
      
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onClose={markWelcomeAsSeen}
        userFirstName={user?.user_metadata?.first_name}
      />

      {/* Debug: Realtime Status - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <RealtimeStatus 
          connections={[
            { id: 'student-dashboard', status: 'optimized', isConnected: true }
          ]} 
        />
      )}

      <StudentMainHeader />
      <StudentDashboardHeader onSignOut={signOut} />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationBanner />
          
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back! Continue your learning journey.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setQuickStartOpen(true)}
                style={{ backgroundColor: '#859FE0' }}
                className="hover:opacity-90 text-black shadow-md"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Quick Start
              </Button>
              <IssueReportButton />
            </div>
          </div>
          
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList 
              className="grid w-full grid-cols-4 mb-8"
              style={{ backgroundColor: '#FFDA00' }}
            >
              <TabsTrigger 
                value="dashboard"
                className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="calendar"
                className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="certificates"
                className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                Certificates
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
                style={{ color: 'black' }}
              >
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              <DashboardStats stats={studentStats} />
              <StudentBadgesSection />

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

            <TabsContent value="calendar">
              <StudentCalendarTab />
            </TabsContent>

            <TabsContent value="certificates">
              <StudentCertificatesTab />
            </TabsContent>

            <TabsContent value="profile">
              <StudentProfileTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <StudentQuickStartModal 
        open={quickStartOpen} 
        onOpenChange={setQuickStartOpen} 
      />
      
      <LMSTreeFooter />
      </div>
    </StudentDashboardErrorBoundary>
  );
};

export default StudentDashboard;
