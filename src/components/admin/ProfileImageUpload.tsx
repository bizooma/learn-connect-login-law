
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
}

const ProfileImageUpload = ({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      setPreviewUrl(imageUrl);

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      onImageUpdate(imageUrl);
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!user) return;

    setUploading(true);
    try {
      // Remove from storage
      if (currentImageUrl) {
        const fileName = `${user.id}/profile.${currentImageUrl.split('.').pop()}`;
        await supabase.storage
          .from('profile-images')
          .remove([fileName]);
      }

      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({ profile_image_url: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setPreviewUrl(null);
      onImageUpdate(null);
      toast({
        title: "Success",
        description: "Profile image removed successfully",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
  };

  const getInitials = () => {
    if (!user?.user_metadata?.first_name && !user?.user_metadata?.last_name) {
      return user?.email?.charAt(0).toUpperCase() || "U";
    }
    const firstName = user?.user_metadata?.first_name || "";
    const lastName = user?.user_metadata?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="profile-image">Profile Image</Label>
      
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={previewUrl || ""} alt="Profile" />
          <AvatarFallback className="text-lg">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              className="relative"
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Image"}
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
