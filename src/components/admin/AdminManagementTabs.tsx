
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import AssignmentManagement from "./AssignmentManagement";
import UserProgressManagement from "./UserProgressManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import ProfileManagement from "./ProfileManagement";

const AdminManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses" className="w-full">
        <TabsList 
          className="grid w-full grid-cols-7"
          style={{ backgroundColor: '#FFDA00' }}
        >
          <TabsTrigger 
            value="courses"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Courses
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="assignments"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Assignments
          </TabsTrigger>
          <TabsTrigger 
            value="progress"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            User Progress
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Quizzes
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Profile
          </TabsTrigger>
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

        <TabsContent value="profile" className="space-y-4">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
