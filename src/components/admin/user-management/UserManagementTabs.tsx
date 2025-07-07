
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import InactiveUsersTab from "./InactiveUsersTab";
import UserAuditTab from "./UserAuditTab";
import BulkStudentPasswordUpdate from "../BulkStudentPasswordUpdate";
import { logger } from "@/utils/logger";

const UserManagementTabs = () => {
  const handleUserRestored = () => {
    // This will trigger a refresh of the active users list
    // The individual components handle their own data fetching
    logger.log('User restored - components will refresh their data');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Users</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="bulk-password">Bulk Password</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          <InactiveUsersTab onUserRestored={handleUserRestored} />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <UserAuditTab />
        </TabsContent>
        
        <TabsContent value="bulk-password" className="space-y-4">
          <BulkStudentPasswordUpdate />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementTabs;
