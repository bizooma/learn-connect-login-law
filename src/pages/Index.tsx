
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log('Index useEffect triggered with:', {
      user: !!user,
      authLoading,
      roleLoading,
      isOwner,
      isTeamLeader,
      isStudent,
      isClient,
      isFree,
      isAdmin,
      userEmail: user?.email,
      userId: user?.id,
      currentPath: location.pathname,
      hasRedirected: hasRedirected.current,
      lastUserId: lastUserIdRef.current
    });

    // Track user changes to detect fresh logins
    const currentUserId = user?.id || null;
    const userChanged = currentUserId !== lastUserIdRef.current;
    
    if (userChanged) {
      console.log('Index: User changed, resetting redirect flag', {
        oldUserId: lastUserIdRef.current,
        newUserId: currentUserId
      });
      hasRedirected.current = false;
      lastUserIdRef.current = currentUserId;
    }

    // Wait for both auth and role loading to complete before making decisions
    if (authLoading || roleLoading) {
      console.log('Index: Still loading, waiting...', { authLoading, roleLoading });
      return;
    }

    // If no user after loading is complete, ensure we stay on auth page
    if (!user) {
      console.log('Index: No user found after loading complete, staying on auth page');
      hasRedirected.current = false; // Reset redirect flag
      return;
    }

    // Prevent multiple redirects for the same user session
    if (hasRedirected.current && !userChanged) {
      console.log('Index: Already redirected for this user session, skipping...');
      return;
    }

    // Only redirect authenticated users with confirmed roles
    if (user && !authLoading && !roleLoading) {
      console.log('Index: User authenticated with role confirmed, checking redirects...');
      
      try {
        // Redirect owners to their dedicated dashboard
        if (isOwner) {
          console.log('Index: Redirecting owner to owner dashboard');
          hasRedirected.current = true;
          navigate("/owner-dashboard", { replace: true });
          return;
        }
        // Redirect team leaders to their dedicated dashboard
        if (isTeamLeader) {
          console.log('Index: Redirecting team leader to team leader dashboard');
          hasRedirected.current = true;
          navigate("/team-leader-dashboard", { replace: true });
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
        // If no specific role determined, stay on main dashboard
        console.log('Index: No specific role or admin user, staying on main dashboard');
        hasRedirected.current = true; // Mark as handled to prevent loops
      } catch (error) {
        console.error('Index: Error during navigation:', error);
        hasRedirected.current = false; // Reset on error
      }
    }
  }, [user?.id, isOwner, isTeamLeader, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading || (user && roleLoading)) {
        console.warn('Index: Loading timeout reached, forcing navigation decisions');
        // Force a decision after 10 seconds to prevent infinite loading
        if (user && !hasRedirected.current) {
          console.log('Index: Timeout fallback - defaulting to main dashboard');
          hasRedirected.current = true;
        }
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [authLoading, roleLoading, user]);

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
