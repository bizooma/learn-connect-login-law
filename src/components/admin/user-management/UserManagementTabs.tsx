
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, UserX, History } from "lucide-react";
import UserManagement from "./UserManagement";
import InactiveUsersTab from "./InactiveUsersTab";
import UserAuditTab from "./UserAuditTab";

interface UserManagementTabsProps {
  activeUsersCount?: number;
  inactiveUsersCount?: number;
}

const UserManagementTabs = ({ activeUsersCount = 0, inactiveUsersCount = 0 }: UserManagementTabsProps) => {
  const handleUserRestored = () => {
    // Trigger refresh of active users tab
    window.location.reload(); // Simple refresh for now
  };

  const handleUserDeleted = () => {
    // Trigger refresh of inactive users tab
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Active Users
            {activeUsersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeUsersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Inactive Users
            {inactiveUsersCount > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-1">
                {inactiveUsersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-6">
          <InactiveUsersTab onUserRestored={handleUserRestored} />
        </TabsContent>
        
        <TabsContent value="audit" className="mt-6">
          <UserAuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementTabs;
