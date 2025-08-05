
import { useEffect, useState, useRef } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { extractYouTubeVideoId, getYouTubeContainerId } from '@/utils/youTubeUtils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useVideoStabilityMonitor } from '@/hooks/useVideoStabilityMonitor';
import VideoErrorBoundary from './VideoErrorBoundary';

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
  const [error, setError] = useState<string | null>(null);
  const videoId = extractYouTubeVideoId(videoUrl);
  const lastProgressRef = useRef<number>(0);
  
  // PHASE 1: Video stability monitoring
  const {
    trackLoadAttempt,
    trackLoadFailure,
    trackPlaybackError,
    trackProgressUpdate,
    getStabilityReport
  } = useVideoStabilityMonitor({
    videoId: videoId || undefined,
    videoType: 'youtube',
    onStabilityIssue: (metrics) => {
      console.warn('🚨 YouTube video stability issue detected:', metrics);
      setError(`Video stability issue: ${metrics.lastError || 'Multiple failures detected'}`);
    }
  });

  const handleProgress = (currentTime: number, duration: number) => {
    if (duration <= 0) return;

    // Track progress for stability monitoring
    trackProgressUpdate();

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

  const handleReady = (player: any) => {
    console.log('YouTube player ready for video:', videoId);
    setError(null);
    trackLoadAttempt(); // Track successful load
  };

  const { isReady, isPlaying, currentTime, duration, initializePlayer } = useYouTubePlayer({
    videoId: videoId || '',
    containerId,
    onProgress: handleProgress,
    onStateChange: handleStateChange,
    onReady: handleReady,
    onError: (error: string) => {
      trackPlaybackError(error);
      setError(error);
    }
  });

  const handleRetry = () => {
    console.log('🔄 Retrying YouTube video load for:', videoId);
    setError(null);
    setHasCompleted(false);
    trackLoadAttempt();
    
    try {
      initializePlayer();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown retry error';
      trackLoadFailure(errorMsg);
      setError(errorMsg);
    }
  };

  // Set error if no video ID
  useEffect(() => {
    if (!videoId) {
      const errorMsg = 'Invalid YouTube URL';
      trackLoadFailure(errorMsg);
      setError(errorMsg);
    }
  }, [videoId, trackLoadFailure]);

  if (!videoId || error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Video Error</p>
          <p className="text-sm text-gray-500 mb-4">{error || 'Invalid YouTube URL'}</p>
          <Button 
            onClick={handleRetry}
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
    <VideoErrorBoundary>
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
    </VideoErrorBoundary>
  );
};

export default YouTubeVideoPlayer;
