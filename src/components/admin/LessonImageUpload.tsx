
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface LessonImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  lessonIndex: number;
}

const LessonImageUpload = ({ currentImageUrl, onImageUpdate, lessonIndex }: LessonImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      logger.log('Starting image upload for file:', file.name, 'size:', file.size);
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `lesson_${lessonIndex}_${timestamp}_${randomId}.${fileExt}`;

      logger.log('Uploading to storage with filename:', fileName);

      // Try to upload to lesson-images bucket first
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('lesson-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        logger.error('Upload to lesson-images failed:', uploadError);
        
        // Fallback: try course-images bucket
        logger.log('Trying fallback upload to course-images bucket...');
        const { error: fallbackError } = await supabase.storage
          .from('course-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (fallbackError) {
          logger.error('Fallback upload also failed:', fallbackError);
          throw new Error(`Upload failed: ${fallbackError.message}`);
        }

        // Get public URL from course-images bucket
        const { data } = supabase.storage
          .from('course-images')
          .getPublicUrl(fileName);

        const imageUrl = data.publicUrl;
        logger.log('Fallback upload successful, URL:', imageUrl);
        setPreviewUrl(imageUrl);
        onImageUpdate(imageUrl);
      } else {
        // Get public URL from lesson-images bucket
        const { data } = supabase.storage
          .from('lesson-images')
          .getPublicUrl(fileName);

        const imageUrl = data.publicUrl;
        logger.log('Primary upload successful, URL:', imageUrl);
        setPreviewUrl(imageUrl);
        onImageUpdate(imageUrl);
      }

      toast({
        title: "Success",
        description: "Lesson image uploaded successfully",
      });
    } catch (error: any) {
      logger.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload lesson image",
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
      description: "Lesson image removed successfully",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    logger.log('File selected:', file.name, file.type, file.size);
    uploadImage(file);
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <Label>Lesson Image</Label>
      
      <div className="flex items-center space-x-4">
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Lesson preview" 
            className="w-20 h-20 object-cover rounded-lg border"
            onError={() => {
              logger.error('Failed to load image:', previewUrl);
              setPreviewUrl(null);
            }}
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

export default LessonImageUpload;
