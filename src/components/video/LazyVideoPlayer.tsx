
import { useState, useRef, useEffect, useCallback } from 'react';
import VideoThumbnail from './VideoThumbnail';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import { useVideoPerformance } from '@/hooks/useVideoPerformance';
import { isYouTubeUrl } from '@/utils/youTubeUtils';

interface LazyVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, watchPercentage: number) => void;
  onComplete?: () => void;
  className?: string;
  autoLoad?: boolean;
  intersectionThreshold?: number;
}

const LazyVideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  className = "aspect-video",
  autoLoad = false,
  intersectionThreshold = 0.1
}: LazyVideoPlayerProps) => {
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
      { threshold: intersectionThreshold }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [intersectionThreshold, autoLoad]);

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

  const enhancedOnProgress = useCallback((currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  }, [onProgress]);

  const enhancedOnComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const isYouTube = isYouTubeUrl(videoUrl);

  return (
    <div ref={containerRef} className={className}>
      {isPlayerLoaded ? (
        isYouTube ? (
          <YouTubeVideoPlayer
            videoUrl={videoUrl}
            title={title}
            onProgress={enhancedOnProgress}
            onComplete={enhancedOnComplete}
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
                  enhancedOnProgress(currentTime, duration, watchPercentage);
                }
              }}
              onEnded={enhancedOnComplete}
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

export default LazyVideoPlayer;
