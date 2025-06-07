
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileData {
  url: string;
  name: string;
  size: number;
}

interface MultipleFileUploadProps {
  currentFiles: FileData[];
  onFilesUpdate: (files: FileData[]) => void;
  label: string;
  contentType: string;
  contentIndex: number;
}

const MultipleFileUpload = ({ 
  currentFiles = [], 
  onFilesUpdate, 
  label, 
  contentType, 
  contentIndex 
}: MultipleFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  console.log('MultipleFileUpload render:', { currentFiles, label, contentType, contentIndex });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    console.log('Starting file upload for', files.length, 'files');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${contentType}-${contentIndex}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${contentType}-files/${fileName}`;

        console.log('Uploading file:', file.name, 'to path:', filePath);

        const { error: uploadError } = await supabase.storage
          .from('course-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course-files')
          .getPublicUrl(filePath);

        console.log('File uploaded successfully:', publicUrl);

        return {
          url: publicUrl,
          name: file.name,
          size: file.size
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const updatedFiles = [...currentFiles, ...uploadedFiles];
      
      console.log('All files uploaded, updating with:', updatedFiles);
      onFilesUpdate(updatedFiles);
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      
      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload files: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    console.log('Removing file at index:', indexToRemove);
    const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
    console.log('Updated files after removal:', updatedFiles);
    onFilesUpdate(updatedFiles);
    toast.success('File removed');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <Label className="text-sm font-medium">{label}</Label>
          
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="mt-2">
                <Label htmlFor={`multiple-files-${contentType}-${contentIndex}`} className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Click to upload multiple files
                  </span>
                  <Input
                    id={`multiple-files-${contentType}-${contentIndex}`}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Multiple files up to 50MB each
              </p>
            </div>
          </div>
          
          {isUploading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading files...</span>
            </div>
          )}

          {/* Current Files List */}
          {currentFiles && currentFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Files ({currentFiles.length})</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {currentFiles.map((file, index) => (
                  <div
                    key={`${file.url}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, '_blank')}
                        className="flex items-center space-x-1"
                        title="Download file"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFile(index)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        title="Remove file"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
              <p>Debug: {currentFiles?.length || 0} files loaded</p>
              <p>Files: {JSON.stringify(currentFiles?.map(f => f.name) || [])}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultipleFileUpload;
