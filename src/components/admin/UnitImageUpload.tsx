
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

interface UnitImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  unitIndex: number;
  lessonIndex: number;
}

const UnitImageUpload = ({ 
  currentImageUrl, 
  onImageUpdate, 
  unitIndex, 
  lessonIndex 
}: UnitImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `unit-${lessonIndex}-${unitIndex}-${Math.random()}.${fileExt}`;
      const filePath = `unit-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      onImageUpdate(publicUrl);
      toast.success('Unit image uploaded successfully');
    } catch (error) {
      logger.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUpdate(null);
    toast.success('Unit image removed');
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Unit Image</Label>
          
          {currentImageUrl ? (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={currentImageUrl}
                  alt={`Unit ${unitIndex + 1} image`}
                  className="w-full h-32 object-cover rounded-md border"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <div className="text-center">
                <Image className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <Label htmlFor={`unit-image-${lessonIndex}-${unitIndex}`} className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Click to upload unit image
                    </span>
                    <Input
                      id={`unit-image-${lessonIndex}-${unitIndex}`}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitImageUpload;
