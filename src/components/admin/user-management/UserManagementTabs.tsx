
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import InactiveUsersTab from "./InactiveUsersTab";
import UserAuditTab from "./UserAuditTab";
import BulkStudentPasswordUpdate from "../BulkStudentPasswordUpdate";
import RoleUpdateDiagnostics from "./RoleUpdateDiagnostics";
import UserDataConsistencyChecker from "./UserDataConsistencyChecker";
import ManagerAssignmentImport from "./ManagerAssignmentImport";

const UserManagementTabs = () => {
  const handleUserRestored = () => {
    console.log('User restored - components will refresh their data');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="active">Active Users</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
          <TabsTrigger value="assign-managers">Assign Managers</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="bulk-password">Bulk Password</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="consistency">Data Check</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          <InactiveUsersTab onUserRestored={handleUserRestored} />
        </TabsContent>

        <TabsContent value="assign-managers" className="space-y-4">
          <ManagerAssignmentImport />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <UserAuditTab />
        </TabsContent>
        
        <TabsContent value="bulk-password" className="space-y-4">
          <BulkStudentPasswordUpdate />
        </TabsContent>
        
        <TabsContent value="diagnostics" className="space-y-4">
          <RoleUpdateDiagnostics />
        </TabsContent>
        
        <TabsContent value="consistency" className="space-y-4">
          <UserDataConsistencyChecker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementTabs;
