
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ProfileImageUpload from "../admin/ProfileImageUpload";
import StudentPasswordChange from "./StudentPasswordChange";
import { logger } from "@/utils/logger";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  law_firm_name: string;
  job_title: string;
  profile_image_url: string;
}

const StudentProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    law_firm_name: '',
    job_title: '',
    profile_image_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        law_firm_name: data.law_firm_name || '',
        job_title: data.job_title || '',
        profile_image_url: data.profile_image_url || ''
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          law_firm_name: profile.law_firm_name,
          job_title: profile.job_title,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }finally {
      setSaving(false);
    }
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    setProfile(prev => ({
      ...prev,
      profile_image_url: imageUrl || ""
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>My Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileImageUpload
            currentImageUrl={profile.profile_image_url}
            onImageUpdate={handleImageUpdate}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="law_firm_name">Law Firm Name</Label>
            <Input
              id="law_firm_name"
              value={profile.law_firm_name}
              onChange={(e) => setProfile(prev => ({ ...prev, law_firm_name: e.target.value }))}
              placeholder="Enter your law firm name"
            />
          </div>

          <div>
            <Label htmlFor="job_title">Job Title (Optional)</Label>
            <Input
              id="job_title"
              value={profile.job_title}
              onChange={(e) => setProfile(prev => ({ ...prev, job_title: e.target.value }))}
              placeholder="Enter your job title"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500 mt-1">
              Email cannot be changed. Contact an administrator if you need to update your email address.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <StudentPasswordChange />
    </div>
  );
};

export default StudentProfileTab;
