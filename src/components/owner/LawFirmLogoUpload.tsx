
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type LawFirm = Tables<'law_firms'>;

interface LawFirmLogoUploadProps {
  lawFirm: LawFirm;
  onUpdate: (updates: Partial<LawFirm>) => Promise<LawFirm | null>;
}

const LawFirmLogoUpload = ({ lawFirm, onUpdate }: LawFirmLogoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lawFirm.id}-logo.${fileExt}`;
      const filePath = `law-firm-logos/${fileName}`;

      logger.log('Uploading law firm logo:', filePath);

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        logger.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      logger.log('Logo uploaded, public URL:', publicUrl);

      // Update law firm with new logo URL
      await onUpdate({ logo_url: publicUrl });

      toast({
        title: "Success",
        description: "Law firm logo updated successfully",
      });
    } catch (error) {
      logger.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await onUpdate({ logo_url: null });
      toast({
        title: "Success",
        description: "Law firm logo removed successfully",
      });
    } catch (error) {
      logger.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Law Firm Logo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lawFirm.logo_url ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={lawFirm.logo_url}
                alt="Law firm logo"
                className="h-24 w-24 object-contain rounded-lg border"
              />
            </div>
            <div className="flex justify-center space-x-2">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Change Logo"}
                  </span>
                </Button>
              </Label>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="flex justify-center">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button variant="outline" disabled={uploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        )}
        
        <Input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        
        <p className="text-sm text-gray-500 text-center">
          Upload a logo for your law firm. Recommended size: 200x200px or larger.
        </p>
      </CardContent>
    </Card>
  );
};

export default LawFirmLogoUpload;
