
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import RoleChecker from "./admin/RoleChecker";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading } = useUserRole();

  // Show loading while role is being determined
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

  // Show role checker if user is not admin (for debugging)
  if (!isAdmin) {
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
