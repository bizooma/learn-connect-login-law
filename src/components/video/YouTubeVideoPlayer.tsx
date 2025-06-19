
import { useEffect, useState, useRef } from 'react';
import { useEnhancedYouTubePlayer } from '@/hooks/useEnhancedYouTubePlayer';
import { extractYouTubeVideoId, getYouTubeContainerId } from '@/utils/youTubeUtils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface YouTubeVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, watchPercentage: number) => void;
  onComplete?: () => void;
  className?: string;
}

const YouTubeVideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  className = "w-full h-full" 
}: YouTubeVideoPlayerProps) => {
  const [containerId] = useState(() => getYouTubeContainerId());
  const [hasCompleted, setHasCompleted] = useState(false);
  const videoId = extractYouTubeVideoId(videoUrl);
  const lastProgressRef = useRef<number>(0);

  const handleProgress = (currentTime: number, duration: number) => {
    if (duration <= 0) return;

    const watchPercentage = Math.min((currentTime / duration) * 100, 100);
    
    // Only call onProgress if significant progress change (avoid spam)
    if (Math.abs(watchPercentage - lastProgressRef.current) >= 1) {
      lastProgressRef.current = watchPercentage;
      
      if (onProgress) {
        onProgress(currentTime, duration, watchPercentage);
      }

      // Check for completion (95% threshold)
      if (watchPercentage >= 95 && !hasCompleted) {
        setHasCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }
    }
  };

  const handleStateChange = (state: number) => {
    // YouTube player states:
    // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
    
    if (state === 0 && !hasCompleted) { // Video ended
      setHasCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleError = (error: string) => {
    console.error('YouTube video player error:', error);
  };

  const { isReady, isPlaying, currentTime, duration, error, retry } = useEnhancedYouTubePlayer({
    videoId: videoId || '',
    containerId,
    onProgress: handleProgress,
    onStateChange: handleStateChange,
    onError: handleError
  });

  if (!videoId) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Invalid YouTube URL</p>
          <p className="text-sm text-gray-500 mt-1">Please check the video URL</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Video Error</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={retry}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden relative ${className}`}>
      <div id={containerId} className="w-full h-full" />
      
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading video...</p>
            {title && <p className="text-sm text-gray-500 mt-1">{title}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoPlayer;
