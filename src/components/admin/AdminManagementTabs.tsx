
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Debug Mode:</strong> Using minimal admin components. Active tab: {activeTab}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Courses Management</h3>
              <p className="text-gray-600">Course management functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Courses tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Management</h3>
              <p className="text-gray-600">User management functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Users tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Progress</h3>
              <p className="text-gray-600">Progress tracking functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Progress tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quiz Management</h3>
              <p className="text-gray-600">Quiz management functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Quizzes tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>
              <p className="text-gray-600">Notification management functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Notifications tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Management</h3>
              <p className="text-gray-600">Profile management functionality (simplified for debugging)</p>
              <div className="mt-4 text-sm text-green-600">
                ✓ Profile tab is rendering successfully
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManagementTabs;
