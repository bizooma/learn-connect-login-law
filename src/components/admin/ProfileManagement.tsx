
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import ProfileImageUpload from "./ProfileImageUpload";
import UserCourseProgress from "../user/UserCourseProgress";
import PasswordChangeSection from "../shared/PasswordChangeSection";

const ProfileManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    law_firm_name: '',
    job_title: '',
    profile_image_url: '',
  });

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

      if (error) {
        throw error;
      }

      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        law_firm_name: data.law_firm_name || '',
        job_title: data.job_title || '',
        profile_image_url: data.profile_image_url || '',
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          law_firm_name: formData.law_firm_name,
          job_title: formData.job_title,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

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
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpdate = (imageUrl: string | null) => {
    logger.log('Image updated:', imageUrl);
    setFormData(prev => ({
      ...prev,
      profile_image_url: imageUrl || ''
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="progress">Course Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <ProfileImageUpload
                  currentImageUrl={formData.profile_image_url}
                  onImageUpdate={handleImageUpdate}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="law_firm_name">Law Firm Name</Label>
                  <Input
                    id="law_firm_name"
                    name="law_firm_name"
                    type="text"
                    value={formData.law_firm_name}
                    onChange={handleInputChange}
                    placeholder="Enter your law firm name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title (Optional)</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    type="text"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    placeholder="Enter your job title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">
                    Email cannot be changed. Contact an administrator if you need to update your email address.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <PasswordChangeSection />
        </TabsContent>

        <TabsContent value="progress">
          {user && <UserCourseProgress userId={user.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileManagement;
