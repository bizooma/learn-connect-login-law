
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageFile } from './course-form/fileUploadUtils';

interface ModuleImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  moduleIndex: number;
}

const ModuleImageUpload: React.FC<ModuleImageUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  moduleIndex
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const imageUrl = await uploadImageFile(file);
      onImageUpdate(imageUrl);
      toast.success('Module image uploaded successfully');
    } catch (error) {
      console.error('Error uploading module image:', error);
      toast.error('Failed to upload image');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUpdate(null);
    toast.success('Module image removed');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={`module-image-${moduleIndex}`}>Module Image</Label>
      
      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Module preview"
            className="w-32 h-24 object-cover rounded-lg border border-gray-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <Image className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Input
          id={`module-image-${moduleIndex}`}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="flex-1"
        />
        {isUploading && (
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Upload className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Recommended: 400x300px, max 5MB (JPG, PNG, WebP)
      </p>
    </div>
  );
};

export default ModuleImageUpload;
