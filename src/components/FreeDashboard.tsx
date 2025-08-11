import { useState, useEffect, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, User, Gift, LogOut, Flame, Target } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import MiniLeaderboard from "./leaderboards/MiniLeaderboard";
import GlobalErrorBoundary from "./ErrorBoundary/GlobalErrorBoundary";
import FreeDashboardContent from "./free/FreeDashboardContent";
import IssueReportButton from "./support/IssueReportButton";
import { logger } from "@/utils/logger";
import { toast } from "@/hooks/use-toast";

const FreeDashboard = () => {
  const { user, signOut } = useAuth();
  const { isFree, role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("resources");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    law_firm_name: "",
    job_title: "",
    profile_image_url: ""
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // Redirect if not a free user (only when role is determined)
  useEffect(() => {
    logger.debug('FreeDashboard: useEffect triggered', {
      user: !!user,
      isFree,
      role,
      roleLoading,
      userEmail: user?.email
    });

    // Don't redirect if we're still loading roles
    if (roleLoading) {
      logger.debug('FreeDashboard: Still loading roles, waiting...');
      return;
    }

    // If no user after role loading is complete, redirect to auth
    if (!roleLoading && !user) {
      logger.debug('FreeDashboard: No user found after role loading complete, redirecting to home');
      navigate("/", { replace: true });
      return;
    }

    // Only redirect if role loading is complete AND user is definitely not a free user
    // Add extra validation to prevent false redirects
    if (!roleLoading && user && role && !isFree) {
      logger.debug('FreeDashboard: User is not a free user after loading complete', { 
        role, 
        isFree, 
        userId: user.id,
        email: user.email 
      });
      navigate("/", { replace: true });
      return;
    }
  }, [isFree, role, roleLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Show welcome toast when arriving right after signup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('signup') === '1') {
      toast({
        title: "Welcome to New Frontier University",
        description: "Your free account is ready. Enjoy the free resources!",
      });
      // Remove the query param from the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('signup');
      const newSearch = url.searchParams.toString();
      window.history.replaceState({}, '', url.pathname + (newSearch ? `?${newSearch}` : ''));
    }
  }, [location.search]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          law_firm_name: data.law_firm_name || "",
          job_title: data.job_title || "",
          profile_image_url: data.profile_image_url || ""
        });
      }
    } catch (error) {
      logger.error('Error fetching profile', { error });
    } finally {
      setProfileLoading(false);
    }
  };

  // Show loading while role is being determined or profile is loading
  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If role is determined but user is not free, don't render (will redirect)
  if (!isFree) {
    return null;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header style={{ background: '#213C82' }} className="shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <img 
                    src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                    alt="New Frontier University" 
                    className="h-12 w-auto"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Gift className="h-8 w-8 text-white" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">Free Dashboard</h1>
                    <p className="text-white/80 text-sm">Welcome, {profile.first_name || "User"}! Explore our free resources.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={signOut}
                  className="flex items-center text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationBanner />
          
          <div className="mb-8 flex justify-end">
            <IssueReportButton />
          </div>

          {/* Mini Leaderboards with error boundaries */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <GlobalErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Leaderboard unavailable</div>}>
                <MiniLeaderboard
                  type="learning_streak"
                  title="Learning Streak Leaders"
                  icon={<Flame className="h-4 w-4 text-orange-500" />}
                  limit={5}
                />
              </GlobalErrorBoundary>
              <GlobalErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Leaderboard unavailable</div>}>
                <MiniLeaderboard
                  type="sales_training"
                  title="Sales Training Top 5"
                  icon={<Target className="h-4 w-4 text-green-500" />}
                  limit={5}
                />
              </GlobalErrorBoundary>
              <GlobalErrorBoundary fallback={<div className="p-4 text-center text-gray-500">Leaderboard unavailable</div>}>
                <MiniLeaderboard
                  type="legal_training"
                  title="Legal Training Top 5"
                  icon={<BookOpen className="h-4 w-4 text-blue-500" />}
                  limit={5}
                />
              </GlobalErrorBoundary>
            </div>
          )}

          <FreeDashboardContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            profile={profile}
            setProfile={setProfile}
            userId={user?.id || ""}
          />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

// PERFORMANCE OPTIMIZATION: Memoized export for heavy dashboard component
export default memo(FreeDashboard);
