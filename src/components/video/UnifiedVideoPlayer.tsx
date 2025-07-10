
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import VideoThumbnail from './VideoThumbnail';
import { useVideoPerformance } from '@/hooks/useVideoPerformance';
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

  const { metrics, startLoadTimer, endLoadTimer, recordError, recordRetry } = useVideoPerformance({
    videoId: videoUrl,
    onMetricsUpdate: (metrics) => {
      if (metrics.loadDuration && metrics.loadDuration > 5000) {
        logger.warn('Slow video loading detected:', metrics);
      }
    }
  });

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

  const handlePlayerError = useCallback(() => {
    logger.error('UnifiedVideoPlayer: Player error for video:', videoUrl);
    recordError();
    setHasError(true);
    setIsPlayerLoaded(false);
  }, [recordError, videoUrl]);

  const handleRetry = useCallback(() => {
    logger.log('UnifiedVideoPlayer: Retrying player for video:', videoUrl);
    recordRetry();
    setHasError(false);
    setIsPlayerLoaded(false);
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

  // Auto-load when autoLoad is true and component mounts or video URL changes
  useEffect(() => {
    if (autoLoad && !isPlayerLoaded && !hasError) {
      logger.log('UnifiedVideoPlayer: Auto-loading player for video:', videoUrl);
      handleLoadPlayer();
    }
  }, [autoLoad, isPlayerLoaded, hasError, handleLoadPlayer, videoUrl]);

  if (!videoUrl) {
    logger.log('UnifiedVideoPlayer: No video URL provided');
    return null;
  }

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  };

  const handleVideoError = () => {
    logger.error('UnifiedVideoPlayer: Video error for URL:', videoUrl);
    setVideoError(true);
    handlePlayerError();
  };

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

  const isYouTube = isYouTubeUrl(videoUrl);
  logger.log('UnifiedVideoPlayer: Video type determined:', { isYouTube, videoUrl });

  return (
    <div ref={containerRef} className={className}>
      {isPlayerLoaded ? (
        isYouTube ? (
          <YouTubeVideoPlayer
            key={videoUrl}
            videoUrl={videoUrl}
            title={title}
            onProgress={handleVideoProgress}
            onComplete={onComplete}
            className="w-full h-full"
          />
        ) : (
          <div className="bg-gray-100 rounded-lg overflow-hidden relative w-full h-full">
            <video
              key={videoUrl}
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
        )
      ) : (
        <VideoThumbnail
          videoUrl={videoUrl}
          title={title}
          onPlayClick={handleLoadPlayer}
          isLoading={metrics.playerState === 'loading'}
          hasError={hasError}
          onRetry={handleRetry}
          className="w-full h-full"
        />
      )}
    </div>
  );
};

export default UnifiedVideoPlayer;
