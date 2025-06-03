
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only proceed if we have auth data and roles are loaded
    if (authLoading || !user || roleLoading || hasRedirected) {
      return;
    }

    console.log('Processing redirect for user:', { 
      userId: user.id, 
      isOwner, 
      isStudent, 
      isClient, 
      isFree, 
      isAdmin,
      currentPath: location.pathname
    });

    // Set flag to prevent multiple redirects
    setHasRedirected(true);

    // Redirect based on role with a small delay to ensure state is stable
    const redirectTimer = setTimeout(() => {
      if (isAdmin) {
        console.log('User is admin, staying on login page to show AdminDashboard');
        // Admins stay on the login page to see AdminDashboard
        return;
      } else if (isOwner) {
        console.log('Redirecting to owner dashboard');
        navigate("/owner-dashboard", { replace: true });
      } else if (isClient) {
        console.log('Redirecting to client dashboard');
        navigate("/client-dashboard", { replace: true });
      } else if (isFree) {
        console.log('Redirecting to free dashboard');
        navigate("/free-dashboard", { replace: true });
      } else if (isStudent) {
        console.log('Redirecting to student dashboard');
        navigate("/student-dashboard", { replace: true });
      }
    }, 50);

    return () => clearTimeout(redirectTimer);
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, hasRedirected, location.pathname]);

  // Show loading only while checking auth state
  if (authLoading) {
    console.log('Showing loading: auth loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show auth page
  if (!user) {
    console.log('No user found, showing auth page');
    return <AuthPage />;
  }

  // Show loading while roles are being fetched for the first time only
  if (roleLoading && !hasRedirected) {
    console.log('Showing loading: role loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Show admin dashboard for admins, regular dashboard for others
  console.log('Rendering dashboard for user', { isAdmin });
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
