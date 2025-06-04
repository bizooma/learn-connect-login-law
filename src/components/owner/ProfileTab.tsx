
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import LawFirmLogoUpload from "./LawFirmLogoUpload";
import ProfileImageUpload from "../admin/ProfileImageUpload";
import { User, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type LawFirm = Tables<'law_firms'>;

interface ProfileTabProps {
  lawFirm: LawFirm;
  onUpdateLawFirm: (updates: Partial<LawFirm>) => Promise<LawFirm | null>;
}

const ProfileTab = ({ lawFirm, onUpdateLawFirm }: ProfileTabProps) => {
  const { user } = useAuth();
  const [lawFirmName, setLawFirmName] = useState(lawFirm.name);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { toast } = useToast();

  // Load user profile data
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_image_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setProfileImageUrl(data.profile_image_url || '');
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleSaveLawFirmName = async () => {
    if (!lawFirmName.trim()) {
      toast({
        title: "Error",
        description: "Law firm name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onUpdateLawFirm({ name: lawFirmName.trim() });
      toast({
        title: "Success",
        description: "Law firm name updated successfully",
      });
    } catch (error) {
      console.error('Error updating law firm name:', error);
      toast({
        title: "Error",
        description: "Failed to update law firm name",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonalInfo = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpdate = (newImageUrl: string | null) => {
    setProfileImageUrl(newImageUrl || '');
  };

  if (loadingProfile) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Law Firm Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="law-firm-name">Law Firm Name</Label>
            <div className="flex space-x-2">
              <Input
                id="law-firm-name"
                value={lawFirmName}
                onChange={(e) => setLawFirmName(e.target.value)}
                placeholder="Enter your law firm name"
                disabled={saving}
              />
              <Button 
                onClick={handleSaveLawFirmName}
                disabled={saving || lawFirmName.trim() === lawFirm.name}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <LawFirmLogoUpload 
        lawFirm={lawFirm} 
        onUpdate={onUpdateLawFirm} 
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileImageUpload 
            currentImageUrl={profileImageUrl}
            userId={user?.id || ''}
            onImageUpdate={handleProfileImageUpdate}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-100"
            />
            <p className="text-sm text-gray-500">
              Email addresses can only be changed by administrators through the management console.
            </p>
          </div>

          <Button 
            onClick={handleSavePersonalInfo}
            disabled={saving || (!firstName.trim() || !lastName.trim())}
            className="w-full md:w-auto"
          >
            {saving ? "Saving..." : "Save Personal Information"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
