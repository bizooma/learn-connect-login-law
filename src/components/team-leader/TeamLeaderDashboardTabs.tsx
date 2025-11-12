import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, User, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DashboardContent from "@/components/dashboard/DashboardContent";
import TeamLeaderProfileTab from "./TeamLeaderProfileTab";
import TeamMemberManagement from "./TeamMemberManagement";
import TeamLeadershipInfoCard from "./TeamLeadershipInfoCard";
import TeamLeaderStatsCards from "./TeamLeaderStatsCards";
import { useTeamLeaderProgress } from "@/hooks/useTeamLeaderProgress";

const TeamLeaderDashboardTabs = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [courseTab, setCourseTab] = useState("assigned");
  
  // Fetch team progress at parent level to share across components
  const { teamProgress, loading: progressLoading, fetchTeamLeaderProgress, clearCache } = useTeamLeaderProgress();

  // Initial data load
  useEffect(() => {
    if (user?.id) {
      fetchTeamLeaderProgress(user.id);
    }
  }, [user?.id]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(() => {
      clearCache(user.id);
      fetchTeamLeaderProgress(user.id, true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [user?.id, clearCache, fetchTeamLeaderProgress]);

  if (!user) return null;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList 
        className="grid w-full grid-cols-4"
        style={{ backgroundColor: '#FFDA00' }}
      >
        <TabsTrigger 
          value="overview" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger 
          value="courses" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          My Courses
        </TabsTrigger>
        <TabsTrigger 
          value="team" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <Users className="h-4 w-4 mr-2" />
          Team Management
        </TabsTrigger>
        <TabsTrigger 
          value="profile" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="space-y-6">
          <TeamLeadershipInfoCard />
          <TeamLeaderStatsCards 
            teamProgress={teamProgress} 
            loading={progressLoading} 
          />
          <DashboardContent
            activeTab={courseTab}
            onTabChange={setCourseTab}
            userId={user.id}
            title="Team Leader Dashboard"
            description="Monitor your learning progress and manage your team's development"
            assignedTabLabel="Assigned Courses"
            completedTabLabel="Completed Courses"
            yellowTabs={true}
          />
        </div>
      </TabsContent>

      <TabsContent value="courses" className="mt-6">
        <DashboardContent
          activeTab={courseTab}
          onTabChange={setCourseTab}
          userId={user.id}
          title="My Learning Journey"
          description="Track your personal course progress and achievements"
          assignedTabLabel="My Assigned Courses"
          completedTabLabel="My Completed Courses"
        />
      </TabsContent>

      <TabsContent value="team" className="mt-6">
        <TeamMemberManagement 
          teamProgress={teamProgress}
          progressLoading={progressLoading}
          onRefresh={() => {
            if (user?.id) {
              clearCache(user.id);
              fetchTeamLeaderProgress(user.id, true);
            }
          }}
        />
      </TabsContent>

      <TabsContent value="profile" className="mt-6">
        <TeamLeaderProfileTab />
      </TabsContent>
    </Tabs>
  );
};

export default TeamLeaderDashboardTabs;
