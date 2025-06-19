
import { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import LazyVideoPlayer from './LazyVideoPlayer';

interface UnifiedVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, watchPercentage: number) => void;
  onComplete?: () => void;
  className?: string;
  autoLoad?: boolean;
}

const UnifiedVideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  className = "aspect-video",
  autoLoad = false
}: UnifiedVideoPlayerProps) => {
  const [videoError, setVideoError] = useState(false);

  if (!videoUrl) {
    return null;
  }

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  if (videoError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Unable to load video</p>
          <p className="text-sm text-gray-500 mt-1">Please check the video URL or try again later</p>
        </div>
      </div>
    );
  }

  return (
    <LazyVideoPlayer
      videoUrl={videoUrl}
      title={title}
      onProgress={handleVideoProgress}
      onComplete={onComplete}
      className={className}
      autoLoad={autoLoad}
    />
  );
};

export default UnifiedVideoPlayer;
