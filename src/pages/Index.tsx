
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import ClientDashboard from "../components/ClientDashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);
  const redirectCountRef = useRef(0);
  const lastUserIdRef = useRef<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

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
      hasRedirected: hasRedirectedRef.current,
      redirectCount: redirectCountRef.current,
      isRedirecting
    });

    // Circuit breaker: prevent too many redirects
    if (redirectCountRef.current > 5) {
      console.error('Index: Too many redirect attempts, stopping redirects');
      return;
    }

    // Prevent multiple redirects or redirects while already redirecting
    if (hasRedirectedRef.current || isRedirecting) {
      console.log('Index: Already redirected or redirecting, skipping');
      return;
    }

    // Only redirect if we have a user, roles are loaded, and we're on the root path
    if (!authLoading && !roleLoading && user && location.pathname === "/") {
      console.log('Index: User authenticated on root path, checking redirects...');
      
      setIsRedirecting(true);
      redirectCountRef.current += 1;
      
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        console.log('Index: Redirecting owner to owner dashboard');
        hasRedirectedRef.current = true;
        navigate("/owner-dashboard", { replace: true });
        return;
      }
      // Redirect students to their dedicated dashboard
      if (isStudent) {
        console.log('Index: Redirecting student to student dashboard');
        hasRedirectedRef.current = true;
        navigate("/student-dashboard", { replace: true });
        return;
      }
      // Redirect clients to their dedicated dashboard
      if (isClient) {
        console.log('Index: Redirecting client to client dashboard');
        hasRedirectedRef.current = true;
        navigate("/client-dashboard", { replace: true });
        return;
      }
      // Redirect free users to their dedicated dashboard
      if (isFree) {
        console.log('Index: Redirecting free user to free dashboard');
        hasRedirectedRef.current = true;
        navigate("/free-dashboard", { replace: true });
        return;
      }
      // If no specific role, stay on main dashboard (this page)
      console.log('Index: No specific role found, staying on main dashboard');
      setIsRedirecting(false);
    } else {
      console.log('Index: Not redirecting because:', {
        hasUser: !!user,
        authLoading,
        roleLoading,
        currentPath: location.pathname
      });
      setIsRedirecting(false);
    }
  }, [user?.id, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname, isRedirecting]);

  // Reset redirect flags when user changes
  useEffect(() => {
    const currentUserId = user?.id;
    const lastUserId = lastUserIdRef.current;
    
    if (currentUserId !== lastUserId) {
      console.log('Index: User changed, resetting redirect flags');
      hasRedirectedRef.current = false;
      redirectCountRef.current = 0;
      setIsRedirecting(false);
      lastUserIdRef.current = currentUserId || null;
    }
  }, [user?.id]);

  // Show loading while checking auth state
  if (authLoading || (user && roleLoading) || isRedirecting) {
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
