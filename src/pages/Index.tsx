
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
    console.log('Index: useEffect triggered', { 
      pathname: location.pathname, 
      authLoading, 
      roleLoading, 
      userId: user?.id,
      isStudent,
      hasRedirected: hasRedirected.current
    });

    // CRITICAL FIX: Only handle routing if we're actually on the index route
    // This prevents interference with users who are directly accessing dashboard routes
    if (location.pathname !== '/' && location.pathname !== '/index') {
      console.log('Index: Not on index route, skipping redirect logic:', location.pathname);
      return;
    }

    // Track user changes to detect fresh logins
    const currentUserId = user?.id || null;
    const userChanged = currentUserId !== lastUserIdRef.current;
    
    if (userChanged) {
      hasRedirected.current = false;
      lastUserIdRef.current = currentUserId;
      console.log('Index: User changed:', { from: lastUserIdRef.current, to: currentUserId });
    }

    // Wait for both auth and role loading to complete before making decisions
    if (authLoading || roleLoading) {
      console.log('Index: Still loading:', { authLoading, roleLoading, userId: user?.id, currentPath: location.pathname });
      return;
    }

    // If no user after loading is complete, stay on homepage for auth
    if (!user) {
      hasRedirected.current = false;
      console.log('Index: No user, staying on auth page');
      return;
    }

    // Prevent multiple redirects for the same user session
    if (hasRedirected.current && !userChanged) {
      console.log('Index: Already redirected for this user session');
      return;
    }

    // Get the correct dashboard route for this user
    const getUserDashboardRoute = () => {
      console.log('Index: Determining route for user roles:', { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree });
      if (isAdmin) return '/admin-dashboard';
      if (isOwner) return '/owner-dashboard';
      if (isTeamLeader) return '/team-leader-dashboard';
      if (isStudent) return '/student-dashboard';
      if (isClient) return '/client-dashboard';
      if (isFree) return '/free-dashboard';
      console.log('Index: No specific role found, using default dashboard');
      return '/dashboard';
    };

    const correctRoute = getUserDashboardRoute();
    
    // Only redirect if we have a user and we're on the homepage
    if (user && !authLoading && !roleLoading) {
      console.log('Index: Ready to redirect from homepage:', { 
        userId: user.id, 
        email: user.email,
        isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree,
        currentPath: location.pathname,
        targetRoute: correctRoute
      });
      
      try {
        console.log(`Index: Executing redirect to ${correctRoute}`);
        hasRedirected.current = true;
        navigate(correctRoute, { replace: true });
      } catch (error) {
        console.error('Index: Navigation error:', error);
        hasRedirected.current = false;
      }
    }
  }, [user?.id, isOwner, isTeamLeader, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  // Removed emergency timeout logic - let proper auth/role loading handle routing

  // Show loading while auth or roles are being determined
  if (authLoading || (user && roleLoading)) {
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
    return <AuthPage />;
  }

  // For authenticated users without specific role redirects, show default dashboard
  return (
    <div>
      <NotificationBanner />
      <Dashboard />
    </div>
  );
};

export default Index;
