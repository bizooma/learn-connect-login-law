
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagementTabs from "./user-management/UserManagementTabs";
import QuizManagement from "./QuizManagement";
import AssignmentManagement from "./AssignmentManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import GlobalEventManagement from "./GlobalEventManagement";
import AdminTeamManagement from "./team-management/AdminTeamManagement";

const AdminManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-yellow-500">
          <TabsTrigger value="courses" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Courses</TabsTrigger>
          <TabsTrigger value="users" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Users</TabsTrigger>
          <TabsTrigger value="teams" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Teams</TabsTrigger>
          <TabsTrigger value="assignments" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Assignments</TabsTrigger>
          <TabsTrigger value="progress" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Progress</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Notifications</TabsTrigger>
          <TabsTrigger value="events" className="text-black data-[state=active]:bg-yellow-600 data-[state=active]:text-black">Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagementTabs />
        </TabsContent>
        
        <TabsContent value="teams" className="space-y-4">
          <AdminTeamManagement />
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
        
        <TabsContent value="events" className="space-y-4">
          <GlobalEventManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
