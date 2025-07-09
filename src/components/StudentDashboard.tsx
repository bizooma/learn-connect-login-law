
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, Award, GraduationCap, User } from "lucide-react";
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

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assigned");
  const [mainTab, setMainTab] = useState("dashboard");
  const { stats, loading: statsLoading } = useDashboardStats();
  
  // First-time user experience
  const {
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
  } = useFirstTimeUser();

  useEffect(() => {
    console.log('StudentDashboard: useEffect triggered with:', {
      user: !!user,
      isStudent,
      roleLoading,
      userEmail: user?.email
    });

    // If no user, redirect immediately
    if (!user) {
      console.log('StudentDashboard: No user found, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a student
    if (!roleLoading && user && !isStudent) {
      console.log('StudentDashboard: User is not a student, redirecting to main dashboard');
      navigate("/", { replace: true });
      return;
    }
  }, [isStudent, roleLoading, user, navigate]);

  // Show loading while checking roles or fetching data
  if (roleLoading || statsLoading || !user) {
    console.log('StudentDashboard: Showing loading state, roleLoading:', roleLoading, 'statsLoading:', statsLoading, 'hasUser:', !!user);
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
      {/* Confetti Animation */}
      <Confetti active={showConfetti} />
      
      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcome}
        onClose={markWelcomeAsSeen}
        userFirstName={user?.user_metadata?.first_name}
      />

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
            <IssueReportButton />
          </div>
          
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList 
              className="grid w-full grid-cols-3 mb-8"
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

            <TabsContent value="certificates">
              <StudentCertificatesTab />
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
