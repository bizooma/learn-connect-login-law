
import { useState } from 'react';
import { Play } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';

interface UnifiedVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, watchPercentage: number) => void;
  onComplete?: () => void;
  className?: string;
}

const UnifiedVideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  className = "aspect-video" 
}: UnifiedVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!videoUrl) {
    return null;
  }

  const isYouTube = isYouTubeUrl(videoUrl);

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  };

  const handleUploadedVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration;
    
    if (duration > 0) {
      const watchPercentage = (currentTime / duration) * 100;
      handleVideoProgress(currentTime, duration, watchPercentage);
    }
  };

  const handleUploadedVideoEnded = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (videoError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <p className="text-gray-600">Unable to load video</p>
          <p className="text-sm text-gray-500 mt-1">Please check the video URL or try again later</p>
        </div>
      </div>
    );
  }

  if (isYouTube) {
    return (
      <YouTubeVideoPlayer
        videoUrl={videoUrl}
        title={title}
        onProgress={handleVideoProgress}
        onComplete={onComplete}
        className={className}
      />
    );
  }

  // Handle uploaded/direct video files
  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden relative ${className}`}>
      <video
        src={videoUrl}
        controls
        className="w-full h-full object-contain"
        onTimeUpdate={handleUploadedVideoProgress}
        onEnded={handleUploadedVideoEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setVideoError(true)}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <Play className="h-8 w-8 text-gray-800" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedVideoPlayer;
