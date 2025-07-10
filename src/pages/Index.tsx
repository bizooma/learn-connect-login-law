
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
    // Track user changes to detect fresh logins
    const currentUserId = user?.id || null;
    const userChanged = currentUserId !== lastUserIdRef.current;
    
    if (userChanged) {
      hasRedirected.current = false;
      lastUserIdRef.current = currentUserId;
    }

    // Wait for both auth and role loading to complete before making decisions
    if (authLoading || roleLoading) {
      return;
    }

    // If no user after loading is complete, ensure we stay on auth page
    if (!user) {
      hasRedirected.current = false;
      return;
    }

    // Prevent multiple redirects for the same user session
    if (hasRedirected.current && !userChanged) {
      return;
    }

    // Only redirect authenticated users with confirmed roles
    if (user && !authLoading && !roleLoading) {
      try {
        // Redirect admins to their dedicated dashboard (highest priority)
        if (isAdmin) {
          hasRedirected.current = true;
          navigate("/admin-dashboard", { replace: true });
          return;
        }
        // Redirect owners to their dedicated dashboard
        if (isOwner) {
          hasRedirected.current = true;
          navigate("/owner-dashboard", { replace: true });
          return;
        }
        // Redirect team leaders to their dedicated dashboard
        if (isTeamLeader) {
          hasRedirected.current = true;
          navigate("/team-leader-dashboard", { replace: true });
          return;
        }
        // Redirect students to their dedicated dashboard
        if (isStudent) {
          hasRedirected.current = true;
          navigate("/student-dashboard", { replace: true });
          return;
        }
        // Redirect clients to their dedicated dashboard
        if (isClient) {
          hasRedirected.current = true;
          navigate("/client-dashboard", { replace: true });
          return;
        }
        // Redirect free users to their dedicated dashboard
        if (isFree) {
          hasRedirected.current = true;
          navigate("/free-dashboard", { replace: true });
          return;
        }
        // Fallback: if no specific role determined, redirect to general dashboard
        hasRedirected.current = true;
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        hasRedirected.current = false;
      }
    }
  }, [user?.id, isOwner, isTeamLeader, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, location.pathname]);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading || (user && roleLoading)) {
        console.warn('Loading timeout reached');
        if (user && !hasRedirected.current) {
          hasRedirected.current = true;
        }
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [authLoading, roleLoading, user]);

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
