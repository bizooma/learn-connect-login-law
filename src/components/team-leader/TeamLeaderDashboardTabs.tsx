
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, User, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DashboardContent from "@/components/dashboard/DashboardContent";
import TeamLeaderProfileTab from "./TeamLeaderProfileTab";
import TeamMemberManagement from "./TeamMemberManagement";

const TeamLeaderDashboardTabs = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [courseTab, setCourseTab] = useState("assigned");

  if (!user) return null;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center">
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="courses" className="flex items-center">
          <BookOpen className="h-4 w-4 mr-2" />
          My Courses
        </TabsTrigger>
        <TabsTrigger value="team" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Team Management
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
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
        <TeamMemberManagement />
      </TabsContent>

      <TabsContent value="profile" className="mt-6">
        <TeamLeaderProfileTab />
      </TabsContent>
    </Tabs>
  );
};

export default TeamLeaderDashboardTabs;
