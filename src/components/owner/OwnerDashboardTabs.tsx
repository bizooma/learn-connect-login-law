
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings, Calendar as CalendarIcon } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import EmployeeManagement from "./EmployeeManagement";
import OverviewTab from "./OverviewTab";
import CalendarTab from "./CalendarTab";
import SettingsTab from "./SettingsTab";

type LawFirm = Tables<'law_firms'>;

interface OwnerDashboardTabsProps {
  lawFirm: LawFirm;
}

const OwnerDashboardTabs = ({ lawFirm }: OwnerDashboardTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center">
          <Building2 className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="employees" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Employees
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="employees">
        <EmployeeManagement lawFirm={lawFirm} />
      </TabsContent>

      <TabsContent value="calendar">
        <CalendarTab />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab lawFirm={lawFirm} />
      </TabsContent>
    </Tabs>
  );
};

export default OwnerDashboardTabs;
