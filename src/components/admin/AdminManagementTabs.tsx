
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "./UserManagement";
import CourseManagement from "./CourseManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import CalendarCleanup from "./CalendarCleanup";

const AdminManagementTabs = () => {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-6" style={{ backgroundColor: '#FFDA00' }}>
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
          value="notifications" 
          className="data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          Notifications
        </TabsTrigger>
        <TabsTrigger 
          value="progress" 
          className="data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          Progress
        </TabsTrigger>
        <TabsTrigger 
          value="calendar" 
          className="data-[state=active]:bg-white data-[state=active]:text-black"
          style={{ color: 'black' }}
        >
          Calendar
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
      <TabsContent value="courses">
        <CourseManagement />
      </TabsContent>
      <TabsContent value="quizzes">
        <QuizManagement />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationManagement />
      </TabsContent>
      <TabsContent value="progress">
        <UserProgressManagement />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarCleanup />
      </TabsContent>
    </Tabs>
  );
};

export default AdminManagementTabs;
