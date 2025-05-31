
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SectionImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  sectionIndex: number;
}

const SectionImageUpload = ({ currentImageUrl, onImageUpdate, sectionIndex }: SectionImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `section_${sectionIndex}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('section-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('section-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      setPreviewUrl(imageUrl);
      onImageUpdate(imageUrl);

      toast({
        title: "Success",
        description: "Section image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload section image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setPreviewUrl(null);
    onImageUpdate(null);
    
    toast({
      title: "Success",
      description: "Section image removed successfully",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

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

  return (
    <div className="space-y-4">
      <Label>Section Image</Label>
      
      <div className="flex items-center space-x-4">
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Section preview" 
            className="w-20 h-20 object-cover rounded-lg border"
          />
        )}
        
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

export default SectionImageUpload;
