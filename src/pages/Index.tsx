

import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
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

    // Only redirect if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user) {
      console.log('Index: User authenticated, checking redirects...');
      
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
        roleLoading
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

  // Show admin dashboard only for admins, not owners, students, clients, or free users
  console.log('Index: Showing dashboard');
  return (
    <div>
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;

