
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import RoleChecker from "./admin/RoleChecker";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useUserRole();

  console.log('AdminDashboard render state:', { 
    isAdmin, 
    loading, 
    userId: user?.id,
    userExists: !!user
  });

  // Show loading while role is being determined, but only briefly
  if (loading) {
    console.log('AdminDashboard: Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Always show admin dashboard for the specific admin user
  const isKnownAdmin = user?.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  const shouldShowAdminDashboard = isAdmin || isKnownAdmin;

  console.log('AdminDashboard access check:', {
    isAdmin,
    isKnownAdmin,
    shouldShowAdminDashboard,
    willRenderTabs: shouldShowAdminDashboard
  });

  if (!shouldShowAdminDashboard) {
    console.log('AdminDashboard: Showing access denied with role checker');
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminDashboardHeader 
          userFirstName={user?.user_metadata?.first_name}
          onSignOut={signOut}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Debug - You don't have admin access</h2>
            <p className="text-gray-600 mb-4">Current user: {user?.email}</p>
          </div>
          <RoleChecker />
        </div>
      </div>
    );
  }

  console.log('AdminDashboard: Rendering full admin dashboard with tabs for user:', user?.id);
  console.log('AdminDashboard: About to render AdminManagementTabs');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader 
        userFirstName={user?.user_metadata?.first_name}
        onSignOut={signOut}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminManagementTabs />
      </div>
    </div>
  );
};

export default AdminDashboard;
