
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AuthPage from "../components/AuthPage";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";
import NotificationBanner from "../components/notifications/NotificationBanner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const IndexContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isOwner, isStudent, isClient, isFree, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      // Redirect owners to their dedicated dashboard
      if (isOwner) {
        navigate("/owner-dashboard");
      }
      // Redirect students to their dedicated dashboard
      else if (isStudent) {
        navigate("/student-dashboard");
      }
      // Redirect clients to their dedicated dashboard
      else if (isClient) {
        navigate("/client-dashboard");
      }
      // Redirect free users to their dedicated dashboard
      else if (isFree) {
        navigate("/free-dashboard");
      }
    }
  }, [user, isOwner, isStudent, isClient, isFree, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Show admin dashboard only for admins, not owners, students, clients, or free users
  return (
    <div>
      {user && <NotificationBanner />}
      {isAdmin ? <AdminDashboard /> : <Dashboard />}
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;
