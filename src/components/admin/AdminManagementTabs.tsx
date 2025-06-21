
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagementTabs from "./user-management/UserManagementTabs";
import QuizManagement from "./QuizManagement";
import AssignmentManagement from "./AssignmentManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import GlobalEventManagement from "./GlobalEventManagement";
import AdminTeamManagement from "./team-management/AdminTeamManagement";
import ProfileManagement from "./ProfileManagement";
import UserActivityManagement from "./activity-tracking/UserActivityManagement";

const AdminManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10 bg-yellow-400">
          <TabsTrigger value="courses" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Courses</TabsTrigger>
          <TabsTrigger value="users" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Users</TabsTrigger>
          <TabsTrigger value="teams" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Teams</TabsTrigger>
          <TabsTrigger value="assignments" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Assignments</TabsTrigger>
          <TabsTrigger value="progress" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Progress</TabsTrigger>
          <TabsTrigger value="activity" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Activity</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Notifications</TabsTrigger>
          <TabsTrigger value="events" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Events</TabsTrigger>
          <TabsTrigger value="profile" className="text-black data-[state=active]:bg-white data-[state=active]:text-black">Profile</TabsTrigger>
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
        
        <TabsContent value="activity" className="space-y-4">
          <UserActivityManagement />
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
        
        <TabsContent value="profile" className="space-y-4">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
