
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

  console.log('AdminManagementTabs render:', { 
    isAdmin, 
    isOwner, 
    userId: user?.id, 
    activeTab,
    userIdMatch: user?.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88'
  });

  // Always allow access for the specific admin user
  const isKnownAdmin = user?.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  const hasAdminAccess = isAdmin || isOwner || isKnownAdmin;

  console.log('Access check result:', { 
    hasAdminAccess, 
    isKnownAdmin, 
    willRenderTabs: hasAdminAccess 
  });

  if (!hasAdminAccess) {
    console.log('Rendering access denied message');
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
        <p className="text-gray-500 mt-2">User ID: {user?.id}</p>
        <p className="text-gray-500">Is Admin: {String(isAdmin)}</p>
        <p className="text-gray-500">Is Owner: {String(isOwner)}</p>
      </div>
    );
  }

  console.log('Rendering admin tabs for tab:', activeTab);

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
          {(() => {
            console.log('Rendering Courses tab content');
            return <CourseManagement />;
          })()}
        </TabsContent>

        <TabsContent value="gamification" className="mt-6">
          {(() => {
            console.log('Rendering Gamification tab content');
            return (
              <div className="text-center py-8">
                <p className="text-gray-500">Gamification management coming soon...</p>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {(() => {
            console.log('Rendering Users tab content');
            return <UserManagement />;
          })()}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          {(() => {
            console.log('Rendering Progress tab content');
            return <UserProgressManagement />;
          })()}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          {(() => {
            console.log('Rendering Activity tab content');
            return (
              <div className="text-center py-8">
                <p className="text-gray-500">Activity monitoring coming soon...</p>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {(() => {
            console.log('Rendering Quizzes tab content');
            return <QuizManagement />;
          })()}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {(() => {
            console.log('Rendering Notifications tab content');
            return <NotificationManagement />;
          })()}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {(() => {
            console.log('Rendering Profile tab content');
            return <ProfileManagement />;
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
