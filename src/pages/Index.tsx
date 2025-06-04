
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user) {
      console.log('User authenticated, redirecting based on role:', { 
        isOwner, 
        isStudent, 
        isClient, 
        isFree, 
        isAdmin,
        userEmail: user.email 
      });
      
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        console.log('Redirecting owner to owner dashboard');
        navigate("/owner-dashboard", { replace: true });
      }
      // Redirect students to their dedicated dashboard
      else if (isStudent) {
        console.log('Redirecting student to student dashboard');
        navigate("/student-dashboard", { replace: true });
      }
      // Redirect clients to their dedicated dashboard
      else if (isClient) {
        console.log('Redirecting client to client dashboard');
        navigate("/client-dashboard", { replace: true });
      }
      // Redirect free users to their dedicated dashboard
      else if (isFree) {
        console.log('Redirecting free user to free dashboard');
        navigate("/free-dashboard", { replace: true });
      }
      // If no specific role, stay on main dashboard (this page)
      else {
        console.log('No specific role found, staying on main dashboard');
      }
    }
  }, [user, isOwner, isStudent, isClient, isFree, isAdmin, authLoading, roleLoading, navigate]);

  // Show loading while checking auth state
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

  // If no user, show auth page
  if (!user) {
    console.log('No user found, showing auth page');
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
