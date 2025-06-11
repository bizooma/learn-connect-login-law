import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import AssignmentManagement from "./AssignmentManagement";
import UserProgressManagement from "./UserProgressManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import DataProtection from "./DataProtection";
import BulkProgressRecalculation from "./progress-management/BulkProgressRecalculation";

const AdminManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">User Progress</TabsTrigger>
          <TabsTrigger value="bulk-ops">Bulk Operations</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data-protection">Data Protection</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <AssignmentManagement />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <UserProgressManagement />
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <QuizManagement />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationManagement />
        </TabsContent>

        <TabsContent value="bulk-ops" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Bulk Operations</h3>
            <p className="text-gray-600 mb-6">
              Administrative tools for bulk data operations and maintenance tasks.
            </p>
            <BulkProgressRecalculation />
          </div>
        </TabsContent>

        <TabsContent value="data-protection" className="space-y-4">
          <DataProtection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
