
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagementTabs from "./user-management/UserManagementTabs";
import CourseManagement from "./CourseManagement";
import QuizManagement from "./QuizManagement";
import CourseAssignmentManagement from "./CourseAssignmentManagement";
import UserProgressManagement from "./UserProgressManagement";
import NotificationManagement from "./NotificationManagement";
import CalendarCleanup from "./CalendarCleanup";
import UserActivityManagement from "./activity-tracking/UserActivityManagement";

const AdminManagementTabs = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList 
          className="grid w-full grid-cols-4 lg:grid-cols-8"
          style={{ backgroundColor: '#FFDA00' }}
        >
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Users
          </TabsTrigger>
          <TabsTrigger 
            value="courses"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Courses
          </TabsTrigger>
          <TabsTrigger 
            value="quizzes"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Quizzes
          </TabsTrigger>
          <TabsTrigger 
            value="assignments"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Assignments
          </TabsTrigger>
          <TabsTrigger 
            value="progress"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Progress
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="calendar"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Calendar
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
            style={{ color: 'black' }}
          >
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagementTabs />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>
        
        <TabsContent value="quizzes" className="space-y-4">
          <QuizManagement />
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <CourseAssignmentManagement />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <UserProgressManagement />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationManagement />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <CalendarCleanup />
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <UserActivityManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
