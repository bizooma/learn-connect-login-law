import { lazy, Suspense } from "react";
import { useUserRole } from "@/hooks/useUserRole";

// Lazy load admin dashboard only when needed
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));

// Loading component for admin dashboard
const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading admin panel...</p>
    </div>
  </div>
);

const LazyAdminDashboard = () => {
  console.log('🎯 LazyAdminDashboard: Component initializing...');
  
  const { isAdmin, loading } = useUserRole();
  
  console.log('🎯 LazyAdminDashboard: Role state:', { isAdmin, loading });

  // Don't load admin dashboard if user is not admin
  if (loading) {
    console.log('🎯 LazyAdminDashboard: Still loading, showing loader...');
    return <AdminLoader />;
  }
  
  if (!isAdmin) {
    console.log('🎯 LazyAdminDashboard: User is not admin, returning null');
    return null;
  }

  console.log('🎯 LazyAdminDashboard: User is admin, rendering AdminDashboard...');
  
  return (
    <Suspense fallback={<AdminLoader />}>
      <AdminDashboard />
    </Suspense>
  );
};

export default LazyAdminDashboard;