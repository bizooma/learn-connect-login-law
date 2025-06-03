
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import RoleChecker from "./admin/RoleChecker";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useUserRole();

  console.log('AdminDashboard render state:', { isAdmin, loading, userId: user?.id });

  // Show loading while role is being determined, but only briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // For the specific admin user, always show admin dashboard regardless of isAdmin flag
  const shouldShowAdminDashboard = isAdmin || user?.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';

  if (!shouldShowAdminDashboard) {
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

  console.log('Rendering AdminDashboard with tabs for user:', user?.id);

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
