
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProfileImageUpload from "../admin/ProfileImageUpload";

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  law_firm_name: string;
  profile_image_url: string;
}

interface FreeProfileTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  userId: string;
}

const FreeProfileTab = ({ profile, setProfile, userId }: FreeProfileTabProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          law_firm_name: profile.law_firm_name,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    setProfile(prev => ({
      ...prev,
      profile_image_url: imageUrl || ""
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        
        <ProfileImageUpload
          currentImageUrl={profile.profile_image_url}
          onImageUpdate={handleImageUpdate}
        />
      </div>

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
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default FreeProfileTab;
