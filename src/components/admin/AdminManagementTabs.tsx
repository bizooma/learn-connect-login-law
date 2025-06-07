
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
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
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
