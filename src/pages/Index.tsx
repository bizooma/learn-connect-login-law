
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import ClientDashboard from "../components/ClientDashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

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
      currentPath: location.pathname,
      hasRedirected: hasRedirected.current
    });

    // Prevent multiple redirects
    if (hasRedirected.current) {
      console.log('Index: Already redirected, skipping');
      return;
    }

    // Only redirect if we have a user, roles are loaded, and we're on the root path
    if (!authLoading && !roleLoading && user && location.pathname === "/") {
      console.log('Index: User authenticated on root path, checking redirects...');
      
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        console.log('Index: Redirecting owner to owner dashboard');
        hasRedirected.current = true;
        navigate("/owner-dashboard", { replace: true });
        return;
      }
      // Redirect students to their dedicated dashboard
      if (isStudent) {
        console.log('Index: Redirecting student to student dashboard');
        hasRedirected.current = true;
        navigate("/student-dashboard", { replace: true });
        return;
      }
      // Redirect clients to their dedicated dashboard
      if (isClient) {
        console.log('Index: Redirecting client to client dashboard');
        hasRedirected.current = true;
        navigate("/client-dashboard", { replace: true });
        return;
      }
      // Redirect free users to their dedicated dashboard
      if (isFree) {
        console.log('Index: Redirecting free user to free dashboard');
        hasRedirected.current = true;
        navigate("/free-dashboard", { replace: true });
        return;
      }
      // If no specific role, stay on main dashboard (this page)
      console.log('Index: No specific role found, staying on main dashboard');
    } else {
      console.log('Index: Not redirecting because:', {
        hasUser: !!user,
        authLoading,
        roleLoading,
        currentPath: location.pathname
      });
    }
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  // Reset redirect flag when user changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [user?.id]);

  // Show loading while checking auth state
  if (authLoading || (user && roleLoading)) {
    console.log('Index: Showing loading state');
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
    console.log('Index: No user found, showing auth page');
    return <AuthPage />;
  }

  // Show appropriate dashboard based on user role for specific paths
  console.log('Index: Showing dashboard for path:', location.pathname);
  
  // If we're on client-dashboard path and user is a client, show ClientDashboard
  if (location.pathname === "/client-dashboard" && isClient) {
    return <ClientDashboard />;
  }
  
  // Show admin dashboard only for admins on root path
  if (location.pathname === "/" && isAdmin) {
    return <AdminDashboard />;
  }
  
  // Default dashboard for root path
  if (location.pathname === "/") {
    return <Dashboard />;
  }

  // For other paths that shouldn't be handled by Index, redirect to root
  console.log('Index: Unexpected path, redirecting to root');
  navigate("/", { replace: true });
  return null;
};

export default Index;
