
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import VideoThumbnail from './VideoThumbnail';
import { useVideoPerformance } from '@/hooks/useVideoPerformance';

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
  console.log('UnifiedVideoPlayer: Rendering with props:', { videoUrl, title, autoLoad });
  
  const [videoError, setVideoError] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { metrics, startLoadTimer, endLoadTimer, recordError, recordRetry } = useVideoPerformance({
    videoId: videoUrl,
    onMetricsUpdate: (metrics) => {
      if (metrics.loadDuration && metrics.loadDuration > 5000) {
        console.warn('Slow video loading detected:', metrics);
      }
    }
  });

  const handleLoadPlayer = useCallback(() => {
    if (isPlayerLoaded) return;

    console.log('UnifiedVideoPlayer: Loading player for video:', videoUrl);
    startLoadTimer();
    setIsPlayerLoaded(true);
    setHasError(false);
  }, [isPlayerLoaded, startLoadTimer, videoUrl]);

  const handlePlayerReady = useCallback(() => {
    console.log('UnifiedVideoPlayer: Player ready for video:', videoUrl);
    endLoadTimer();
  }, [endLoadTimer, videoUrl]);

  const handlePlayerError = useCallback(() => {
    console.error('UnifiedVideoPlayer: Player error for video:', videoUrl);
    recordError();
    setHasError(true);
    setIsPlayerLoaded(false);
  }, [recordError, videoUrl]);

  const handleRetry = useCallback(() => {
    console.log('UnifiedVideoPlayer: Retrying player for video:', videoUrl);
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
    console.log('UnifiedVideoPlayer: Video URL changed, resetting player state:', videoUrl);
    setIsPlayerLoaded(false);
    setHasError(false);
    setVideoError(false);
  }, [videoUrl]);

  // Auto-load when autoLoad is true and component mounts or video URL changes
  useEffect(() => {
    if (autoLoad && !isPlayerLoaded && !hasError) {
      console.log('UnifiedVideoPlayer: Auto-loading player for video:', videoUrl);
      handleLoadPlayer();
    }
  }, [autoLoad, isPlayerLoaded, hasError, handleLoadPlayer, videoUrl]);

  if (!videoUrl) {
    console.log('UnifiedVideoPlayer: No video URL provided');
    return null;
  }

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  };

  const handleVideoError = () => {
    console.error('UnifiedVideoPlayer: Video error for URL:', videoUrl);
    setVideoError(true);
    handlePlayerError();
  };

  if (videoError || hasError) {
    console.log('UnifiedVideoPlayer: Showing error state for video:', videoUrl);
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

  const isYouTube = isYouTubeUrl(videoUrl);
  console.log('UnifiedVideoPlayer: Video type determined:', { isYouTube, videoUrl });

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
