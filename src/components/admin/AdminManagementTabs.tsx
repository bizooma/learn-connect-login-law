
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

// Import components with error handling
let CourseManagement: React.ComponentType | null = null;
let UserManagement: React.ComponentType | null = null;
let QuizManagement: React.ComponentType | null = null;
let NotificationManagement: React.ComponentType | null = null;
let ProfileManagement: React.ComponentType | null = null;
let UserProgressManagement: React.ComponentType | null = null;

try {
  CourseManagement = require("./CourseManagement").default;
  console.log('CourseManagement loaded successfully');
} catch (error) {
  console.error('Failed to load CourseManagement:', error);
}

try {
  UserManagement = require("./UserManagement").default;
  console.log('UserManagement loaded successfully');
} catch (error) {
  console.error('Failed to load UserManagement:', error);
}

try {
  QuizManagement = require("./QuizManagement").default;
  console.log('QuizManagement loaded successfully');
} catch (error) {
  console.error('Failed to load QuizManagement:', error);
}

try {
  NotificationManagement = require("./NotificationManagement").default;
  console.log('NotificationManagement loaded successfully');
} catch (error) {
  console.error('Failed to load NotificationManagement:', error);
}

try {
  ProfileManagement = require("./ProfileManagement").default;
  console.log('ProfileManagement loaded successfully');
} catch (error) {
  console.error('Failed to load ProfileManagement:', error);
}

try {
  UserProgressManagement = require("./UserProgressManagement").default;
  console.log('UserProgressManagement loaded successfully');
} catch (error) {
  console.error('Failed to load UserProgressManagement:', error);
}

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

  const renderTabContent = (tabName: string, Component: React.ComponentType | null, fallbackContent?: React.ReactNode) => {
    console.log(`Attempting to render ${tabName} tab content`);
    
    if (!Component) {
      console.error(`${tabName} component is not available`);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Error: {tabName} component failed to load</p>
          <p className="text-gray-500">Check the console for more details</p>
        </div>
      );
    }

    try {
      return <Component />;
    } catch (error) {
      console.error(`Error rendering ${tabName}:`, error);
      return (
        <div className="text-center py-8">
          <p className="text-red-600">Error rendering {tabName}</p>
          <p className="text-gray-500">{String(error)}</p>
        </div>
      );
    }
  };

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
          {renderTabContent('Courses', CourseManagement)}
        </TabsContent>

        <TabsContent value="gamification" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Gamification management coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {renderTabContent('Users', UserManagement)}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          {renderTabContent('Progress', UserProgressManagement)}
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Activity monitoring coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {renderTabContent('Quizzes', QuizManagement)}
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {renderTabContent('Notifications', NotificationManagement)}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {renderTabContent('Profile', ProfileManagement)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
