
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
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
      isAdmin 
    });

    // Set flag to prevent multiple redirects
    setHasRedirected(true);

    // Redirect based on role with a small delay to ensure state is stable
    const redirectTimer = setTimeout(() => {
      if (isOwner) {
        console.log('Redirecting to owner dashboard');
        navigate("/owner-dashboard", { replace: true });
      } else if (isStudent) {
        console.log('Redirecting to student dashboard');
        navigate("/student-dashboard", { replace: true });
      } else if (isClient) {
        console.log('Redirecting to client dashboard');
        navigate("/client-dashboard", { replace: true });
      } else if (isFree) {
        console.log('Redirecting to free dashboard');
        navigate("/free-dashboard", { replace: true });
      }
      // If none of the above, stay on current page to show Dashboard/AdminDashboard
    }, 50);

    return () => clearTimeout(redirectTimer);
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, hasRedirected]);

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

  // If user has a specific role that should redirect, but hasn't redirected yet, show loading
  if ((isOwner || isStudent || isClient || isFree) && !hasRedirected) {
    console.log('Preparing to redirect, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
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
