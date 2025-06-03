
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  console.log('Index page - Auth state:', { 
    user: !!user, 
    authLoading, 
    roleLoading,
    isAdmin,
    currentPath: window.location.pathname
  });

  // Redirect to login if no user and not already on login page
  useEffect(() => {
    if (!authLoading && !user && window.location.pathname !== '/login') {
      console.log('No user found, redirecting to login page');
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only proceed if we have auth data and roles are loaded
    if (authLoading || !user || roleLoading || hasRedirected) {
      console.log('Skipping redirect check:', { authLoading, hasUser: !!user, roleLoading, hasRedirected });
      return;
    }

    console.log('Processing redirect for user:', { 
      userId: user.id, 
      isOwner, 
      isStudent, 
      isClient, 
      isFree, 
      isAdmin,
      currentPath: window.location.pathname
    });

    // If we're already on the dashboard page and user is admin, don't redirect
    if (window.location.pathname === '/dashboard' && isAdmin) {
      console.log('User is admin and already on dashboard - staying here');
      return;
    }

    // Set flag to prevent multiple redirects
    setHasRedirected(true);

    // Redirect based on role with a small delay to ensure state is stable
    // IMPORTANT: Admins should NOT be redirected - they stay on the main page
    const redirectTimer = setTimeout(() => {
      if (isAdmin) {
        console.log('User is admin, staying on main page to show AdminDashboard');
        // Don't redirect admins - they should see the AdminDashboard on this page
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
    }, 100);

    return () => clearTimeout(redirectTimer);
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, hasRedirected]);

  // Reset redirect flag when user changes
  useEffect(() => {
    setHasRedirected(false);
  }, [user?.id]);

  // Show loading while checking auth state
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

  // If no user, the useEffect above will handle redirect
  if (!user) {
    return null;
  }

  // Show loading while roles are being fetched
  if (roleLoading) {
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
  // Admins should always see the AdminDashboard when they stay on this page
  console.log('Rendering dashboard for user', { isAdmin });
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
