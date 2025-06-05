
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar as CalendarIcon, User, BookOpen } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import EmployeeManagement from "./EmployeeManagement";
import OverviewTab from "./OverviewTab";
import CalendarTab from "./CalendarTab";
import ProfileTab from "./ProfileTab";
import OwnerCourseAssignmentTab from "./OwnerCourseAssignmentTab";

type LawFirm = Tables<'law_firms'>;

interface OwnerDashboardTabsProps {
  lawFirm: LawFirm;
  onUpdateLawFirm: (updates: Partial<LawFirm>) => Promise<LawFirm | null>;
}

const OwnerDashboardTabs = ({ lawFirm, onUpdateLawFirm }: OwnerDashboardTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList 
        className="grid w-full grid-cols-5"
        style={{ backgroundColor: '#FFDA00' }}
      >
        <TabsTrigger 
          value="overview" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Overview
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
          value="assignments" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Assignments
        </TabsTrigger>
        <TabsTrigger 
          value="calendar" 
          className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar
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
        <OverviewTab lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="team">
        <EmployeeManagement lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="assignments">
        <OwnerCourseAssignmentTab lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="calendar">
        <CalendarTab />
      </TabsContent>

      <TabsContent value="profile">
        <ProfileTab lawFirm={lawFirm} onUpdateLawFirm={onUpdateLawFirm} />
      </TabsContent>
    </Tabs>
  );
};

export default OwnerDashboardTabs;
