
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboardHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    law_firm_name?: string;
  }>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, profile_image_url, law_firm_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleCourseCatalogClick = () => {
    navigate("/courses");
  };

  const getInitials = () => {
    const firstName = profile.first_name || user?.user_metadata?.first_name || "";
    const lastName = profile.last_name || user?.user_metadata?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDisplayName = () => {
    const firstName = profile.first_name || user?.user_metadata?.first_name || "";
    const lastName = profile.last_name || user?.user_metadata?.last_name || "";
    return `${firstName} ${lastName}`.trim() || user?.email || "Student";
  };

  const getLawFirmName = () => {
    return profile.law_firm_name || "No law firm specified";
  };

  return (
    <header className="shadow-sm border-b border-gray-200" style={{ backgroundColor: '#213C82' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Profile */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={profile.profile_image_url} 
                alt={getDisplayName()}
              />
              <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">
                {getDisplayName()}
              </p>
              <p className="text-xs text-white/70">{getLawFirmName()}</p>
            </div>
          </div>

          {/* Right side - Course Catalog */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCourseCatalogClick}
              className="flex items-center space-x-2 border-white/20 bg-white text-black hover:bg-gray-100"
            >
              <BookOpen className="h-4 w-4" />
              <span>Course Catalog</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentDashboardHeader;
