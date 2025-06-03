
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminDashboardHeader from "./admin/AdminDashboardHeader";
import AdminManagementTabs from "./admin/AdminManagementTabs";
import RoleChecker from "./admin/RoleChecker";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState("overview");

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
        <AdminManagementTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
