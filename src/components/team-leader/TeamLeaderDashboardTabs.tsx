
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, User } from "lucide-react";
import TeamMemberManagement from "./TeamMemberManagement";
import TeamOverviewTab from "./TeamOverviewTab";
import TeamLeaderProfileTab from "./TeamLeaderProfileTab";

const TeamLeaderDashboardTabs = () => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList 
        className="grid w-full grid-cols-3"
        style={{ backgroundColor: '#FFA500' }}
      >
        <TabsTrigger 
          value="overview" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'white' }}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger 
          value="team" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'white' }}
        >
          <Users className="h-4 w-4 mr-2" />
          Team Members
        </TabsTrigger>
        <TabsTrigger 
          value="profile" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'white' }}
        >
          <User className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <TeamOverviewTab />
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
