
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Index useEffect triggered with:', {
      user: !!user,
      authLoading,
      roleLoading,
      isOwner,
      isStudent,
      isClient,
      isFree,
      isAdmin,
      userEmail: user?.email,
      currentPath: location.pathname
    });

    // Wait for both auth and role loading to complete before making decisions
    if (authLoading || roleLoading) {
      console.log('Index: Still loading, waiting...', { authLoading, roleLoading });
      return;
    }

    // If no user after loading is complete, show auth page
    if (!user) {
      console.log('Index: No user found after loading complete, staying on auth page');
      return;
    }

    // Only redirect authenticated users with confirmed roles
    if (user && !authLoading && !roleLoading) {
      console.log('Index: User authenticated with role confirmed, checking redirects...');
      
      try {
        // Redirect owners to their dedicated dashboard
        if (isOwner) {
          console.log('Index: Redirecting owner to owner dashboard');
          navigate("/owner-dashboard", { replace: true });
          return;
        }
        // Redirect students to their dedicated dashboard
        if (isStudent) {
          console.log('Index: Redirecting student to student dashboard');
          navigate("/student-dashboard", { replace: true });
          return;
        }
        // Redirect clients to their dedicated dashboard
        if (isClient) {
          console.log('Index: Redirecting client to client dashboard');
          navigate("/client-dashboard", { replace: true });
          return;
        }
        // Redirect free users to their dedicated dashboard
        if (isFree) {
          console.log('Index: Redirecting free user to free dashboard');
          navigate("/free-dashboard", { replace: true });
          return;
        }
        // If no specific role determined, stay on main dashboard
        console.log('Index: No specific role or admin user, staying on main dashboard');
      } catch (error) {
        console.error('Index: Error during navigation:', error);
        // If navigation fails, stay on current page
      }
    }
  }, [user?.id, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  // Show loading while auth or roles are being determined
  if (authLoading || (user && roleLoading)) {
    console.log('Index: Showing loading state', { authLoading, roleLoading, hasUser: !!user });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading is complete, show auth page
  if (!user) {
    console.log('Index: No user found, showing auth page');
    return <AuthPage />;
  }

  // Show appropriate dashboard based on role
  console.log('Index: Showing dashboard for authenticated user');
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
