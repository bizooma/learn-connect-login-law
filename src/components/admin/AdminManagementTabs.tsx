
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseManagement from "./CourseManagement";
import UserManagement from "./UserManagement";
import QuizManagement from "./QuizManagement";
import NotificationManagement from "./NotificationManagement";
import ProfileManagement from "./ProfileManagement";
import UserProgressManagement from "./UserProgressManagement";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

const AdminManagementTabs = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { isAdmin, isOwner } = useUserRole();
  const { user } = useAuth();

  console.log('AdminManagementTabs render:', { isAdmin, isOwner, userId: user?.id, activeTab });

  // Special override for the specific admin user
  const hasAdminAccess = isAdmin || isOwner || user?.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';

  if (!hasAdminAccess) {
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
