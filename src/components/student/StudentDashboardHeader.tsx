
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface StudentDashboardHeaderProps {
  onSignOut: () => void;
}

const StudentDashboardHeader = ({ onSignOut }: StudentDashboardHeaderProps) => {
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
      logger.error('Error fetching profile:', error);
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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
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
              <p className="text-sm font-medium text-gray-900">
                {getDisplayName()}
              </p>
              {profile.law_firm_name && (
                <p className="text-xs text-gray-500">{profile.law_firm_name}</p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCourseCatalogClick}
              className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <BookOpen className="h-4 w-4" />
              <span>Course Catalog</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentDashboardHeader;
