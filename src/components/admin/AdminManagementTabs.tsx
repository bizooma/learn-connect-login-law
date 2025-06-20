
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
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
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
