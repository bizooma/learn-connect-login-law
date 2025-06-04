
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, User, Gift, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBanner from "./notifications/NotificationBanner";
import LMSTreeFooter from "./lms-tree/LMSTreeFooter";
import DashboardStats from "./dashboard/DashboardStats";
import FreeDashboardContent from "./free/FreeDashboardContent";

const FreeDashboard = () => {
  const { user, signOut } = useAuth();
  const { isFree } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("resources");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    law_firm_name: "",
    profile_image_url: ""
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not a free user
  useEffect(() => {
    if (!loading && !isFree) {
      navigate("/");
    }
  }, [isFree, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
          profile_image_url: data.profile_image_url || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isFree) {
    return null; // Will redirect in useEffect
  }

  const stats = [
    {
      title: "Free Resources",
      value: "Coming Soon",
      description: "Free learning materials",
      icon: Gift,
      color: "text-emerald-600",
    },
    {
      title: "Profile Status",
      value: "Free User",
      description: "Current membership",
      icon: User,
      color: "text-blue-600",
    },
    {
      title: "Available Content",
      value: "Limited",
      description: "Access level",
      icon: BookOpen,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-100 flex flex-col">
      <div className="flex-1">
        {/* Header with blue background */}
        <div className="text-white shadow-lg" style={{ backgroundColor: '#213C82' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a 
                  href="https://newfrontieruniversity.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <img 
                    src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                    alt="New Frontier University" 
                    className="h-12 w-auto"
                  />
                </a>
                <div>
                  <h1 className="text-3xl font-bold">
                    Free Dashboard
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Welcome, {profile.first_name || "User"}! Explore our free resources.
                  </p>
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
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Full-width notification banner above main dashboard content */}
          <div className="mb-8">
            <NotificationBanner />
          </div>

          <DashboardStats stats={stats} />

          <FreeDashboardContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            profile={profile}
            setProfile={setProfile}
            userId={user.id}
          />
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default FreeDashboard;
