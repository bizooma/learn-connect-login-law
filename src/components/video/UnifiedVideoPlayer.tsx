import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import VideoThumbnail from './VideoThumbnail';
import { useVideoPerformance } from '@/hooks/useVideoPerformance';
import { useVideoStabilityMonitor } from '@/hooks/useVideoStabilityMonitor';
import { useVideoLazyLoading } from '@/hooks/useVideoLazyLoading';
import VideoErrorBoundary from './VideoErrorBoundary';
import { logger } from '@/utils/logger';

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
  autoLoad = true
}: UnifiedVideoPlayerProps) => {
  logger.log('🎥 UnifiedVideoPlayer: Rendering with props:', { videoUrl, title, autoLoad, hasVideoUrl: !!videoUrl });
  
  const [videoError, setVideoError] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // PHASE 4: Lazy loading for performance
  const { elementRef, isVisible, shouldLoad } = useVideoLazyLoading({
    videoId: isYouTubeUrl(videoUrl) ? videoUrl : 'upload-video'
  });

  // Performance monitoring - PHASE 4: Only for YouTube videos to reduce overhead
  const { metrics, startLoadTimer, endLoadTimer, recordError, recordRetry } = useVideoPerformance({
    videoId: videoUrl,
    onMetricsUpdate: (metrics) => {
      if (metrics.loadDuration && metrics.loadDuration > 8000) { // PHASE 4: Increased threshold
        logger.warn('Slow video loading detected:', metrics);
      }
    }
  });

  // Video stability monitoring - PHASE 4: Only for YouTube videos
  const { trackProgressUpdate } = useVideoStabilityMonitor({
    videoId: isYouTubeUrl(videoUrl) && shouldLoad ? videoUrl : undefined,
    videoType: isYouTubeUrl(videoUrl) ? 'youtube' : 'upload'
  });

  const handleVideoProgress = useCallback((currentTime: number, duration: number, watchPercentage: number) => {
    trackProgressUpdate();
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  }, [onProgress, trackProgressUpdate]);

  const handleVideoError = useCallback(() => {
    logger.error('UnifiedVideoPlayer: Video error for URL:', videoUrl);
    setVideoError(true);
    recordError();
    setHasError(true);
  }, [videoUrl, recordError]);

  const handleLoadPlayer = useCallback(() => {
    if (isPlayerLoaded) return;

    logger.log('UnifiedVideoPlayer: Loading player for video:', videoUrl);
    startLoadTimer();
    setIsPlayerLoaded(true);
    setHasError(false);
  }, [isPlayerLoaded, startLoadTimer, videoUrl]);

  const handlePlayerReady = useCallback(() => {
    logger.log('UnifiedVideoPlayer: Player ready for video:', videoUrl);
    endLoadTimer();
  }, [endLoadTimer, videoUrl]);

  const handleRetry = useCallback(() => {
    logger.log('UnifiedVideoPlayer: Retrying player for video:', videoUrl);
    recordRetry();
    setHasError(false);
    setIsPlayerLoaded(false);
    setVideoError(false);
    // Small delay before retrying
    setTimeout(() => {
      handleLoadPlayer();
    }, 500);
  }, [recordRetry, handleLoadPlayer, videoUrl]);

  // Reset player state when video URL changes
  useEffect(() => {
    logger.log('UnifiedVideoPlayer: Video URL changed, resetting player state:', videoUrl);
    setIsPlayerLoaded(false);
    setHasError(false);
    setVideoError(false);
  }, [videoUrl]);

  // Emergency: Always load when autoLoad is true and no errors
  useEffect(() => {
    if (autoLoad && !isPlayerLoaded && !hasError) {
      logger.log('🎬 UnifiedVideoPlayer: Emergency loading player immediately for:', videoUrl);
      handleLoadPlayer();
    }
  }, [autoLoad, isPlayerLoaded, hasError, handleLoadPlayer, videoUrl]);

  if (!videoUrl) {
    logger.log('UnifiedVideoPlayer: No video URL provided');
    return null;
  }

  if (videoError || hasError) {
    logger.log('UnifiedVideoPlayer: Showing error state for video:', videoUrl);
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-2">Unable to load video</p>
          <p className="text-sm text-gray-500 mb-4">Please check the video URL or try again later</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`} 
      ref={(el) => {
        containerRef.current = el;
        elementRef.current = el;
      }}
    >
      {/* Show thumbnail only when player is explicitly not loaded */}
      {!isPlayerLoaded && (
        <VideoThumbnail
          videoUrl={videoUrl}
          title={title}
          onPlayClick={() => {
            logger.log('🎬 UnifiedVideoPlayer: Force loading from thumbnail click');
            handleLoadPlayer();
          }}
          isLoading={false}
          hasError={hasError}
          onRetry={handleRetry}
          className="w-full h-full"
        />
      )}

      {/* Load video when player is ready */}
      {isPlayerLoaded && (
        <>
          {isYouTubeUrl(videoUrl) ? (
            <YouTubeVideoPlayer
              videoUrl={videoUrl}
              title={title}
              onProgress={handleVideoProgress}
              onComplete={onComplete}
              className="w-full h-full"
            />
          ) : (
            <div className="bg-gray-100 rounded-lg overflow-hidden relative w-full h-full">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  const currentTime = video.currentTime;
                  const duration = video.duration;
                  
                  if (duration > 0) {
                    const watchPercentage = (currentTime / duration) * 100;
                    handleVideoProgress(currentTime, duration, watchPercentage);
                  }
                }}
                onEnded={onComplete}
                onError={handleVideoError}
                preload="metadata"
                onLoadedData={handlePlayerReady}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </>
      )}

      {/* Loading indicator when transitioning to video */}
      {isPlayerLoaded && metrics.playerState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedVideoPlayer;