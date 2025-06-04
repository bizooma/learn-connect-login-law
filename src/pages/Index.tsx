
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  console.log('Index: Current state:', {
    user: !!user,
    userId: user?.id,
    authLoading,
    roleLoading,
    isAdmin,
    isOwner,
    isStudent,
    isClient,
    isFree
  });

  useEffect(() => {
    console.log('Index: useEffect triggered with:', {
      user: !!user,
      authLoading,
      roleLoading,
      isOwner,
      isStudent,
      isClient,
      isFree,
      isAdmin
    });

    // If no user, redirect to login
    if (!authLoading && !user) {
      console.log('Index: No user, redirecting to login');
      navigate("/login", { replace: true });
      return;
    }

    // Only redirect if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user) {
      console.log('Index: User authenticated, redirecting based on role:', { 
        isOwner, 
        isStudent, 
        isClient, 
        isFree, 
        isAdmin 
      });
      
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        console.log('Index: Redirecting owner to owner dashboard');
        navigate("/owner-dashboard", { replace: true });
        return;
      }
      // Redirect students to their dedicated dashboard
      if (isStudent) {
        console.log('Index: Redirecting student to student dashboard');
        navigate("/student-dashboard", { replace: true });
        return;
      }
      // Redirect clients to their dedicated dashboard
      if (isClient) {
        console.log('Index: Redirecting client to client dashboard');
        navigate("/client-dashboard", { replace: true });
        return;
      }
      // Redirect free users to their dedicated dashboard
      if (isFree) {
        console.log('Index: Redirecting free user to free dashboard');
        navigate("/free-dashboard", { replace: true });
        return;
      }
      
      // If no specific role is found, log this for debugging
      if (!isAdmin && !isOwner && !isStudent && !isClient && !isFree) {
        console.log('Index: No role detected, user might not have a role assigned');
      }
    }
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate]);

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

  // If user is not authenticated, don't render anything (will redirect to login)
  if (!user) {
    console.log('Index: No user, rendering null');
    return null;
  }

  console.log('Index: Rendering dashboard for role:', { isAdmin });
  
  // Show admin dashboard only for admins, not owners, students, clients, or free users
  return (
    <div>
      <NotificationBanner />
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

export default Index;
