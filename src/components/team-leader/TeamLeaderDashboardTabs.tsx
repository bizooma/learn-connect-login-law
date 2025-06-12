
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, User, BookOpen } from "lucide-react";
import TeamMemberManagement from "./TeamMemberManagement";
import TeamOverviewTab from "./TeamOverviewTab";
import TeamLeaderProfileTab from "./TeamLeaderProfileTab";
import TeamLeaderCoursesTab from "./TeamLeaderCoursesTab";

const TeamLeaderDashboardTabs = () => {
  return (
    <Tabs defaultValue="overview" className="w-full">
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
          Team Members
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

      <TabsContent value="overview" className="space-y-6">
        <TeamOverviewTab />
      </TabsContent>

      <TabsContent value="courses">
        <TeamLeaderCoursesTab />
      </TabsContent>

      <TabsContent value="team">
        <TeamMemberManagement />
      </TabsContent>

      <TabsContent value="profile">
        <TeamLeaderProfileTab />
      </TabsContent>
    </Tabs>
  );
};

export default TeamLeaderDashboardTabs;
