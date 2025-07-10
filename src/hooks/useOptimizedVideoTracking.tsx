import { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoPerformance } from './useVideoPerformance';
import { useVideoProgress } from './useVideoProgress';
import { useVideoCompletion } from './useVideoCompletion';

interface OptimizedVideoTrackingProps {
  unitId: string;
  courseId: string;
  videoId: string;
  videoType?: 'upload' | 'youtube';
  enableDetailedTracking?: boolean;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  watchPercentage: number;
  isCompleted: boolean;
  hasError: boolean;
}

/**
 * Consolidated video tracking hook that combines performance monitoring,
 * progress tracking, and completion detection with optimized updates
 */
export const useOptimizedVideoTracking = ({
  unitId,
  courseId,
  videoId,
  videoType = 'upload',
  enableDetailedTracking = process.env.NODE_ENV === 'development'
}: OptimizedVideoTrackingProps) => {
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    watchPercentage: 0,
    isCompleted: false,
    hasError: false
  });

  const updateTimeoutRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Use existing hooks with optimized settings
  const { metrics, startLoadTimer, endLoadTimer, recordError, recordRetry } = useVideoPerformance({
    videoId,
    enableDetailedTracking,
    onMetricsUpdate: (metrics) => {
      if (metrics.errorCount > 0) {
        setVideoState(prev => ({ ...prev, hasError: true }));
      }
    }
  });

  const { videoProgress, updateVideoProgress } = useVideoProgress(unitId, courseId);
  const { completionState, handleVideoProgress, handleVideoEnded } = useVideoCompletion(unitId, courseId);

  // Debounced update function to prevent excessive state changes
  const debouncedUpdate = useCallback((
    currentTime: number,
    duration: number,
    isPlaying: boolean = false
  ) => {
    const now = Date.now();
    
    // Throttle updates to prevent excessive calls (minimum 2 seconds between updates)
    if (now - lastUpdateTimeRef.current < 2000 && !isPlaying) {
      return;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      const watchPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      
      setVideoState(prev => ({
        ...prev,
        currentTime,
        duration,
        watchPercentage,
        isPlaying,
        isCompleted: watchPercentage >= 95 || completionState.isCompleted
      }));

      // Update tracking systems
      updateVideoProgress(currentTime, duration, watchPercentage);
      handleVideoProgress(currentTime, duration);
      
      lastUpdateTimeRef.current = now;
    }, 1000); // 1 second debounce
  }, [updateVideoProgress, handleVideoProgress, completionState.isCompleted]);

  // YouTube player event handler
  const handleYouTubeStateChange = useCallback((player: any, state: number) => {
    try {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const isPlaying = state === 1;

      if (state === 0) { // Video ended
        handleVideoEnded();
        setVideoState(prev => ({ ...prev, isCompleted: true }));
      } else if (duration > 0) {
        debouncedUpdate(currentTime, duration, isPlaying);
      }
    } catch (error) {
      console.warn('Error handling YouTube state change:', error);
      recordError();
    }
  }, [debouncedUpdate, handleVideoEnded, recordError]);

  // Regular video player event handler
  const handleVideoTimeUpdate = useCallback((video: HTMLVideoElement) => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    const isPlaying = !video.paused;

    if (duration > 0) {
      debouncedUpdate(currentTime, duration, isPlaying);
    }
  }, [debouncedUpdate]);

  const handleVideoEndedEvent = useCallback((video?: HTMLVideoElement) => {
    handleVideoEnded();
    setVideoState(prev => ({ ...prev, isCompleted: true, isPlaying: false }));
  }, [handleVideoEnded]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Combined state for easier consumption
  const combinedState = {
    ...videoState,
    loadDuration: metrics.loadDuration,
    errorCount: metrics.errorCount,
    retryCount: metrics.retryCount,
    playerState: metrics.playerState,
    progressPercentage: Math.max(videoProgress.watch_percentage, videoState.watchPercentage),
    completionAttempts: completionState.completionAttempts
  };

  return {
    videoState: combinedState,
    // Performance methods
    startLoadTimer,
    endLoadTimer,
    recordError,
    recordRetry,
    // Event handlers for different video types
    handleYouTubeStateChange,
    handleVideoTimeUpdate,
    handleVideoEnded: handleVideoEndedEvent,
    // Direct access to underlying data
    metrics,
    videoProgress,
    completionState
  };
};