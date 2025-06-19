
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
  const [videoError, setVideoError] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(autoLoad);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { metrics, startLoadTimer, endLoadTimer, recordError, recordRetry } = useVideoPerformance({
    videoId: videoUrl,
    onMetricsUpdate: (metrics) => {
      if (metrics.loadDuration && metrics.loadDuration > 5000) {
        console.warn('Slow video loading detected:', metrics);
      }
    }
  });

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current || autoLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [autoLoad]);

  const handleLoadPlayer = useCallback(() => {
    if (isPlayerLoaded) return;

    startLoadTimer();
    setIsPlayerLoaded(true);
    setHasError(false);
  }, [isPlayerLoaded, startLoadTimer]);

  const handlePlayerReady = useCallback(() => {
    endLoadTimer();
  }, [endLoadTimer]);

  const handlePlayerError = useCallback(() => {
    recordError();
    setHasError(true);
    setIsPlayerLoaded(false);
  }, [recordError]);

  const handleRetry = useCallback(() => {
    recordRetry();
    setHasError(false);
    setIsPlayerLoaded(false);
    // Small delay before retrying
    setTimeout(() => {
      handleLoadPlayer();
    }, 500);
  }, [recordRetry, handleLoadPlayer]);

  // Auto-load when in view (if not already loaded)
  useEffect(() => {
    if (isIntersecting && !isPlayerLoaded && !hasError && !autoLoad) {
      // Add a small delay to avoid loading too aggressively
      const timer = setTimeout(handleLoadPlayer, 200);
      return () => clearTimeout(timer);
    }
  }, [isIntersecting, isPlayerLoaded, hasError, autoLoad, handleLoadPlayer]);

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
    handlePlayerError();
  };

  if (videoError || hasError) {
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

  return (
    <div ref={containerRef} className={className}>
      {isPlayerLoaded ? (
        isYouTube ? (
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
