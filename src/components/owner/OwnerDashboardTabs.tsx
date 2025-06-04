
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar as CalendarIcon } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import EmployeeManagement from "./EmployeeManagement";
import OverviewTab from "./OverviewTab";
import CalendarTab from "./CalendarTab";

type LawFirm = Tables<'law_firms'>;

interface OwnerDashboardTabsProps {
  lawFirm: LawFirm;
}

const OwnerDashboardTabs = ({ lawFirm }: OwnerDashboardTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview" className="flex items-center">
          <Building2 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="team" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Team Members
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="team">
        <EmployeeManagement lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="calendar">
        <CalendarTab />
      </TabsContent>
    </Tabs>
  );
};

export default OwnerDashboardTabs;
