
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [sessionValidated, setSessionValidated] = useState(false);

  useEffect(() => {
    // Only redirect if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user && sessionValidated) {
      console.log('User authenticated and session validated, redirecting based on role:', { isOwner, isStudent, isClient, isFree, isAdmin });
      
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        navigate("/owner-dashboard", { replace: true });
      }
      // Redirect students to their dedicated dashboard
      else if (isStudent) {
        navigate("/student-dashboard", { replace: true });
      }
      // Redirect clients to their dedicated dashboard
      else if (isClient) {
        navigate("/client-dashboard", { replace: true });
      }
      // Redirect free users to their dedicated dashboard
      else if (isFree) {
        navigate("/free-dashboard", { replace: true });
      }
    }
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate, sessionValidated]);

  useEffect(() => {
    // Validate session with server when user exists
    if (user && !authLoading) {
      console.log('Validating session with server...');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session validation error:', error);
          // If session is invalid, clear it
          supabase.auth.signOut();
          setSessionValidated(false);
        } else {
          console.log('Session validation result:', !!session);
          setSessionValidated(!!session);
        }
      });
    } else if (!user) {
      setSessionValidated(false);
    }
  }, [user, authLoading]);

  // Show loading while checking auth state
  if (authLoading || (user && (roleLoading || !sessionValidated))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user or session is invalid, show auth page
  if (!user || !sessionValidated) {
    console.log('No user found or session invalid, showing auth page');
    return <AuthPage />;
  }

  // Show admin dashboard only for admins, not owners, students, clients, or free users
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
