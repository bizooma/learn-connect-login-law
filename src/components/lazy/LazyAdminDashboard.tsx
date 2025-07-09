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
  const { isAdmin, loading } = useUserRole();

  // Don't load admin dashboard if user is not admin
  if (loading) return <AdminLoader />;
  if (!isAdmin) return null;

  return (
    <Suspense fallback={<AdminLoader />}>
      <AdminDashboard />
    </Suspense>
  );
};

export default LazyAdminDashboard;