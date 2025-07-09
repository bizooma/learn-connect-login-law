
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import LazyAdminDashboard from "../components/lazy/LazyAdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const Index = () => {
  console.log('🏠 Index component initializing...');
  
  console.log('🔐 Getting auth state...');
  const { user, loading: authLoading } = useAuth();
  console.log('🔐 Auth state received:', { hasUser: !!user, authLoading });
  
  console.log('👤 Getting user role...');
  const { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  console.log('👤 User role received:', { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree, roleLoading });
  
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  
  console.log('👤 Index auth state:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    authLoading,
    roleLoading,
    roles: { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree },
    pathname: location.pathname,
    hasRedirected: hasRedirected.current
  });

  useEffect(() => {
    console.log('🔄 Index useEffect triggered:', {
      user: !!user,
      userId: user?.id,
      authLoading,
      roleLoading,
      hasRedirected: hasRedirected.current,
      lastUserId: lastUserIdRef.current
    });
    
    // Track user changes to detect fresh logins
    const currentUserId = user?.id || null;
    const userChanged = currentUserId !== lastUserIdRef.current;
    
    if (userChanged) {
      console.log('👤 User changed:', { from: lastUserIdRef.current, to: currentUserId });
      hasRedirected.current = false;
      lastUserIdRef.current = currentUserId;
    }

    // Wait for both auth and role loading to complete before making decisions
    if (authLoading || roleLoading) {
      console.log('⏳ Still loading:', { authLoading, roleLoading });
      return;
    }

    // If no user after loading is complete, ensure we stay on auth page
    if (!user) {
      console.log('🚫 No user found, staying on auth page');
      hasRedirected.current = false;
      return;
    }

    // Prevent multiple redirects for the same user session
    if (hasRedirected.current && !userChanged) {
      console.log('🔒 Already redirected, preventing duplicate redirect');
      return;
    }

    // Only redirect authenticated users with confirmed roles
    if (user && !authLoading && !roleLoading) {
      console.log('🎯 Ready for role-based redirect:', { isAdmin, isOwner, isTeamLeader, isStudent, isClient, isFree });
      
      try {
        // Redirect owners to their dedicated dashboard
        if (isOwner) {
          console.log('👑 Redirecting owner to dashboard');
          hasRedirected.current = true;
          navigate("/owner-dashboard", { replace: true });
          return;
        }
        // Redirect team leaders to their dedicated dashboard
        if (isTeamLeader) {
          console.log('👨‍💼 Redirecting team leader to dashboard');
          hasRedirected.current = true;
          navigate("/team-leader-dashboard", { replace: true });
          return;
        }
        // Redirect students to their dedicated dashboard
        if (isStudent) {
          console.log('🎓 Redirecting student to dashboard');
          hasRedirected.current = true;
          navigate("/student-dashboard", { replace: true });
          return;
        }
        // Redirect clients to their dedicated dashboard
        if (isClient) {
          console.log('🤝 Redirecting client to dashboard');
          hasRedirected.current = true;
          navigate("/client-dashboard", { replace: true });
          return;
        }
        // Redirect free users to their dedicated dashboard
        if (isFree) {
          console.log('🆓 Redirecting free user to dashboard');
          hasRedirected.current = true;
          navigate("/free-dashboard", { replace: true });
          return;
        }
        // If no specific role determined, stay on main dashboard
        console.log('📊 No specific role, staying on main dashboard');
        hasRedirected.current = true;
      } catch (error) {
        console.error('❌ Navigation error:', error);
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
    console.log('⌛ Showing loading screen:', { authLoading, roleLoading, hasUser: !!user });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">Auth: {authLoading ? 'loading' : 'done'} | Roles: {roleLoading ? 'loading' : 'done'}</p>
        </div>
      </div>
    );
  }

  // If no user after loading is complete, show auth page
  if (!user) {
    console.log('🔐 No user, showing auth page');
    return <AuthPage />;
  }
  
  console.log('✅ Rendering main dashboard:', { isAdmin, userEmail: user.email });
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <LazyAdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
