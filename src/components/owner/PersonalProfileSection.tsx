
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProfileImageUpload from "../admin/ProfileImageUpload";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

const PersonalProfileSection = () => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { toast } = useToast();

  // Load user profile data
  useEffect(() => {
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
        logger.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id]);

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
      logger.error('Error updating personal info:', error);
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
  );
};

export default PersonalProfileSection;
