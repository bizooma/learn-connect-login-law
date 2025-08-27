
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateYouTubeVideo } from '@/utils/youTubeUtils';
import PowerPointVideoIntegration from '../course-form/PowerPointVideoIntegration';

interface VideoUploadSectionProps {
  videoUrl: string;
  videoType: 'youtube' | 'upload';
  onVideoUrlChange: (url: string) => void;
  onVideoTypeChange: (type: 'youtube' | 'upload') => void;
  onVideoFileChange: (file: File | undefined) => void;
}

const VideoUploadSection = ({
  videoUrl,
  videoType,
  onVideoUrlChange,
  onVideoTypeChange,
  onVideoFileChange
}: VideoUploadSectionProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (videoType === 'youtube' && videoUrl) {
      const validation = validateYouTubeVideo(videoUrl);
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  }, [videoUrl, videoType]);

  const handleVideoUrlChange = (url: string) => {
    onVideoUrlChange(url);
    if (videoType === 'youtube' && url) {
      const validation = validateYouTubeVideo(url);
      setValidationError(validation.isValid ? null : validation.error || null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="video-type">Video Source</Label>
        <Select value={videoType} onValueChange={onVideoTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select video source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube URL</SelectItem>
            <SelectItem value="upload">Upload Video File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {videoType === 'youtube' && (
        <div className="space-y-2">
          <Label htmlFor="video-url">YouTube URL</Label>
          <Input
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            value={videoUrl}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            className={validationError ? 'border-destructive' : ''}
          />
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Enter a complete YouTube URL or video ID (11 characters)
          </p>
        </div>
      )}

      {videoType === 'upload' && (
        <div>
          <Label htmlFor="video-file">Video File</Label>
          <Input
            id="video-file"
            type="file"
            accept="video/*"
            onChange={(e) => onVideoFileChange(e.target.files?.[0])}
          />
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <PowerPointVideoIntegration onVideoGenerated={onVideoUrlChange} />
    </div>
  );
};

export default VideoUploadSection;
