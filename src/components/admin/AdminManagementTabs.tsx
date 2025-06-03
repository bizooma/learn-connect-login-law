
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import ProfileManagement from "./ProfileManagement";
import UserProgressManagement from "./UserProgressManagement";
import { useUserRole } from "@/hooks/useUserRole";

const AdminManagementTabs = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { isAdmin, isOwner } = useUserRole();

  if (!isAdmin && !isOwner) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="gamification" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Gamification management coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <UserProgressManagement />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Activity monitoring coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <QuizManagement />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationManagement />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
