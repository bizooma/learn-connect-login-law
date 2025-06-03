
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Video, Presentation } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PowerPointVideoGeneratorProps {
  onVideoGenerated: (videoUrl: string) => void;
}

const PowerPointVideoGenerator = ({ onVideoGenerated }: PowerPointVideoGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [script, setScript] = useState<string>('');
  const [importId, setImportId] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.pptx') || fileName.endsWith('.ppt');
    const hasValidMimeType = validTypes.includes(selectedFile.type);
    
    if (!hasValidExtension && !hasValidMimeType) {
      toast({
        title: "Invalid file type",
        description: "Please select a PowerPoint file (.pptx or .ppt)",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "PowerPoint file must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadAndGenerateScript = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from('powerpoint_video_imports')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_url: '',
          status: 'uploading'
        })
        .select()
        .single();

      if (importError) throw importError;
      setImportId(importRecord.id);

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${importRecord.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('powerpoint-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update import record with file URL
      const { error: updateError } = await supabase
        .from('powerpoint_video_imports')
        .update({ file_url: fileName })
        .eq('id', importRecord.id);

      if (updateError) throw updateError;

      setUploading(false);
      setGeneratingScript(true);

      // Generate script
      const { data: scriptResult, error: scriptError } = await supabase.functions
        .invoke('generate-heygen-video', {
          body: { 
            importId: importRecord.id,
            action: 'generate_script'
          }
        });

      if (scriptError) throw scriptError;

      if (scriptResult.success) {
        setScript(scriptResult.script);
        toast({
          title: "Script generated",
          description: "PowerPoint content has been converted to a narration script",
        });
      } else {
        throw new Error('Script generation failed');
      }

    } catch (error) {
      console.error('Upload/Script error:', error);
      toast({
        title: "Failed to generate script",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setGeneratingScript(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!importId) return;

    setGeneratingVideo(true);
    try {
      const { data: videoResult, error: videoError } = await supabase.functions
        .invoke('generate-heygen-video', {
          body: { 
            importId: importId,
            action: 'generate_video'
          }
        });

      if (videoError) throw videoError;

      if (videoResult.success) {
        onVideoGenerated(videoResult.videoUrl);
        toast({
          title: "Video generated successfully",
          description: "Your AI avatar video has been created",
        });
      } else {
        throw new Error('Video generation failed');
      }

    } catch (error) {
      console.error('Video generation error:', error);
      toast({
        title: "Failed to generate video",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Presentation className="h-5 w-5 mr-2" />
            Upload PowerPoint Presentation
          </CardTitle>
          <CardDescription>
            Upload your PowerPoint file to generate an AI avatar narration video using your custom clone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!file ? (
              <div>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <label htmlFor="powerpoint-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Choose a PowerPoint file</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <input
                  id="powerpoint-upload"
                  type="file"
                  accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supports .pptx and .ppt files up to 50MB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="font-medium">{file.name}</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>

          {file && !script && (
            <Button
              onClick={handleUploadAndGenerateScript}
              disabled={uploading || generatingScript}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : generatingScript ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Generate Script
                </>
              )}
            </Button>
          )}

          {(uploading || generatingScript) && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {uploading ? 'Uploading your PowerPoint file...' : 'AI is analyzing slides and creating narration script...'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {script && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Generated Script
            </CardTitle>
            <CardDescription>
              Review the narration script generated from your PowerPoint content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{script}</pre>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Video Generation</h4>
              <p className="text-sm text-blue-800 mb-3">
                Your script will be narrated by your custom AI avatar clone with the matching voice clone.
              </p>
              <Button
                onClick={handleGenerateVideo}
                disabled={generatingVideo}
                className="w-full"
              >
                {generatingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate AI Avatar Video
                  </>
                )}
              </Button>
            </div>

            {generatingVideo && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
                <strong>Generating your video...</strong>
                <div className="mt-1 space-y-1">
                  <div>✓ Script ready</div>
                  <div>🔄 Creating video with your AI avatar clone...</div>
                  <div className="text-xs text-yellow-700 mt-2">
                    This may take 5-10 minutes depending on script length
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PowerPointVideoGenerator;
