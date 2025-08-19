import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { isYouTubeUrl } from '@/utils/youTubeUtils';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import VideoThumbnail from './VideoThumbnail';
import { logger } from '@/utils/logger';

interface UnifiedVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (currentTime: number, duration: number, watchPercentage: number) => void;
  onComplete?: () => void;
  className?: string;
  autoLoad?: boolean;
}

// Simple loading state enum to prevent render loops
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

const UnifiedVideoPlayer = ({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete, 
  className = "aspect-video",
  autoLoad = true
}: UnifiedVideoPlayerProps) => {
  // EMERGENCY FIX: Single state enum to prevent render loops
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasInitialized = useRef(false);

  logger.log('🎥 UnifiedVideoPlayer: Render state:', { 
    videoUrl: videoUrl?.substring(0, 50) + '...', 
    loadingState, 
    autoLoad,
    hasInitialized: hasInitialized.current 
  });

  // EMERGENCY FIX: Simplified handlers with no circular dependencies
  const handleVideoProgress = useCallback((currentTime: number, duration: number, watchPercentage: number) => {
    if (onProgress) {
      onProgress(currentTime, duration, watchPercentage);
    }
  }, [onProgress]);

  const handleVideoError = useCallback((error?: string) => {
    logger.error('🚨 UnifiedVideoPlayer: Video error:', error || 'Unknown error');
    setLoadingState('error');
    setErrorMessage(error || 'Video failed to load');
  }, []);

  const handleLoadVideo = useCallback(() => {
    if (loadingState === 'loading' || loadingState === 'loaded') return;
    
    logger.log('🎬 UnifiedVideoPlayer: Loading video');
    setLoadingState('loading');
    setErrorMessage('');
    
    // Simulate load completion for immediate rendering
    setTimeout(() => {
      setLoadingState('loaded');
    }, 100);
  }, [loadingState]);

  const handleRetry = useCallback(() => {
    logger.log('🔄 UnifiedVideoPlayer: Retrying video');
    setLoadingState('idle');
    setErrorMessage('');
    hasInitialized.current = false;
    
    // Force reload after brief delay
    setTimeout(() => {
      handleLoadVideo();
    }, 200);
  }, [handleLoadVideo]);

  // EMERGENCY FIX: Single effect to handle initialization
  useEffect(() => {
    // Reset state when URL changes
    if (!hasInitialized.current) {
      setLoadingState('idle');
      setErrorMessage('');
      hasInitialized.current = true;
    }

    // Auto-load if enabled and not already loading/loaded
    if (autoLoad && loadingState === 'idle') {
      logger.log('🎬 Auto-loading video');
      handleLoadVideo();
    }
  }, [videoUrl, autoLoad, loadingState, handleLoadVideo]);

  // Reset when video URL changes
  useEffect(() => {
    hasInitialized.current = false;
    setLoadingState('idle');
    setErrorMessage('');
  }, [videoUrl]);

  if (!videoUrl) {
    return null;
  }

  if (loadingState === 'error') {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-2">Unable to load video</p>
          <p className="text-sm text-gray-500 mb-4">{errorMessage || 'Please try again later'}</p>
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
      ref={containerRef}
    >
      {/* Show thumbnail when not loaded yet */}
      {loadingState === 'idle' && (
        <VideoThumbnail
          videoUrl={videoUrl}
          title={title}
          onPlayClick={handleLoadVideo}
          isLoading={false}
          hasError={false}
          onRetry={handleRetry}
          className="w-full h-full"
        />
      )}

      {/* Show loading state */}
      {loadingState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading video...</p>
          </div>
        </div>
      )}

      {/* Show video when loaded */}
      {loadingState === 'loaded' && (
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
              onError={() => handleVideoError('Video playback failed')}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </>
      )}
    </div>
  );
};

export default UnifiedVideoPlayer;