
import { useState, useRef, useEffect, useCallback } from 'react';
import VideoThumbnail from './VideoThumbnail';
import UnifiedVideoPlayer from './UnifiedVideoPlayer';
import { useVideoPerformance } from '@/hooks/useVideoPerformance';

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

  return (
    <div ref={containerRef} className={className}>
      {isPlayerLoaded ? (
        <UnifiedVideoPlayer
          videoUrl={videoUrl}
          title={title}
          onProgress={enhancedOnProgress}
          onComplete={enhancedOnComplete}
          className="w-full h-full"
        />
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
