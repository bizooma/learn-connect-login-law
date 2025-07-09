
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
  currentFileUrl?: string;
  currentFileName?: string;
  onFileUpdate: (fileUrl: string | null, fileName: string | null, fileSize: number | null) => void;
  label: string;
  contentType: 'module' | 'lesson' | 'unit';
  contentIndex: number;
  parentIndex?: number;
}

const FileUpload = ({ 
  currentFileUrl, 
  currentFileName,
  onFileUpdate, 
  label,
  contentType,
  contentIndex,
  parentIndex 
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size should be less than 50MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${contentType}-${parentIndex !== undefined ? `${parentIndex}-` : ''}${contentIndex}-${Math.random()}.${fileExt}`;
      const filePath = `${contentType}-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);

      onFileUpdate(publicUrl, file.name, file.size);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    onFileUpdate(null, null, null);
    toast.success('File removed');
  };

  const handleDownload = () => {
    if (currentFileUrl) {
      window.open(currentFileUrl, '_blank');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <Label className="text-sm font-medium">{label}</Label>
          
          {currentFileUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium truncate">
                    {currentFileName || 'Uploaded file'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <Label htmlFor={`file-${contentType}-${contentIndex}`} className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Click to upload file
                    </span>
                    <Input
                      id={`file-${contentType}-${contentIndex}`}
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Any file type up to 50MB
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

export default FileUpload;
