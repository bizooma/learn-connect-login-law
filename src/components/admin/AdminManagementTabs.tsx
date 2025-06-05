
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, MessageSquare, BarChart, Settings, UserPlus } from "lucide-react";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import EnhancedCourseAssignmentManagement from "./EnhancedCourseAssignmentManagement";
import NotificationManagement from "./NotificationManagement";
import UserProgressManagement from "./UserProgressManagement";
import QuizManagement from "./QuizManagement";

interface AdminManagementTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminManagementTabs = ({ activeTab, onTabChange }: AdminManagementTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="courses" className="flex items-center">
          <BookOpen className="h-4 w-4 mr-2" />
          Courses
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Users
        </TabsTrigger>
        <TabsTrigger value="assignments" className="flex items-center">
          <UserPlus className="h-4 w-4 mr-2" />
          Assignments
        </TabsTrigger>
        <TabsTrigger value="progress" className="flex items-center">
          <BarChart className="h-4 w-4 mr-2" />
          Progress
        </TabsTrigger>
        <TabsTrigger value="quizzes" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Quizzes
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="space-y-6">
        <CourseManagement />
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="assignments" className="space-y-6">
        <EnhancedCourseAssignmentManagement />
      </TabsContent>

      <TabsContent value="progress" className="space-y-6">
        <UserProgressManagement />
      </TabsContent>

      <TabsContent value="quizzes" className="space-y-6">
        <QuizManagement />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationManagement />
      </TabsContent>
    </Tabs>
  );
};

export default AdminManagementTabs;
