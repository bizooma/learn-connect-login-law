import { useState, useEffect, useRef, useCallback } from 'react';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { useVideoCompletion } from '@/hooks/useVideoCompletion';
import { logger } from '@/utils/logger';

interface UnifiedVideoPerformanceProps {
  unitId: string;
  courseId: string;
  videoElement?: HTMLVideoElement | null;
  youtubePlayer?: any;
  videoType?: 'upload' | 'youtube';
  enablePerformanceTracking?: boolean;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  watchPercentage: number;
  hasError: boolean;
  isCompleted: boolean;
}

export const useUnifiedVideoPerformance = ({
  unitId,
  courseId,
  videoElement,
  youtubePlayer,
  videoType = 'upload',
  enablePerformanceTracking = false
}: UnifiedVideoPerformanceProps) => {
  const { videoProgress, loading, updateVideoProgress } = useVideoProgress(unitId, courseId);
  const { completionState, handleVideoProgress, handleVideoEnded, forceComplete } = useVideoCompletion(unitId, courseId);
  
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    watchPercentage: 0,
    hasError: false,
    isCompleted: false
  });

  // Unified ref management for cleanup
  const cleanupRef = useRef<{
    intervals: Set<number>;
    timeouts: Set<number>;
    eventListeners: Array<() => void>;
  }>({
    intervals: new Set(),
    timeouts: new Set(),
    eventListeners: []
  });

  const progressUpdateRef = useRef<number>();
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldTrackPerformance = enablePerformanceTracking && !isProduction;

  // Centralized progress update function
  const updateProgress = useCallback((currentTime: number, duration: number) => {
    if (duration <= 0) return;

    const watchPercentage = (currentTime / duration) * 100;
    
    setVideoState(prev => ({
      ...prev,
      currentTime,
      duration,
      watchPercentage
    }));

    // Throttled database updates
    if (progressUpdateRef.current) {
      clearTimeout(progressUpdateRef.current);
    }

    progressUpdateRef.current = window.setTimeout(() => {
      try {
        updateVideoProgress(currentTime, duration, watchPercentage);
        handleVideoProgress(currentTime, duration);
      } catch (error) {
        logger.warn('⚠️ Error updating progress:', error);
        setVideoState(prev => ({ ...prev, hasError: true }));
      }
    }, 2000);

    cleanupRef.current.timeouts.add(progressUpdateRef.current);
  }, [updateVideoProgress, handleVideoProgress]);

  // YouTube player management
  useEffect(() => {
    if (videoType !== 'youtube' || !youtubePlayer) return;

    let hasTriggeredCompletion = false;
    let progressInterval: number;

    const handleStateChange = (event: any) => {
      const state = event.data;
      
      if (shouldTrackPerformance) {
        logger.log('🎵 YouTube state change:', state, 'for unit:', unitId);
      }

      setVideoState(prev => ({ ...prev, isPlaying: state === 1 }));

      if (state === 0 && !hasTriggeredCompletion) { // Video ended
        hasTriggeredCompletion = true;
        setVideoState(prev => ({ ...prev, isCompleted: true }));
        handleVideoEnded();
      } else if (state === 1) { // Playing
        // Clear existing interval
        if (progressInterval) {
          clearInterval(progressInterval);
          cleanupRef.current.intervals.delete(progressInterval);
        }

        // Start optimized progress tracking
        progressInterval = window.setInterval(() => {
          try {
            const currentTime = youtubePlayer.getCurrentTime();
            const duration = youtubePlayer.getDuration();
            updateProgress(currentTime, duration);
          } catch (error) {
            logger.warn('⚠️ YouTube progress error:', error);
            setVideoState(prev => ({ ...prev, hasError: true }));
            clearInterval(progressInterval);
            cleanupRef.current.intervals.delete(progressInterval);
          }
        }, 3000);

        cleanupRef.current.intervals.add(progressInterval);
      } else {
        // Paused or other states
        if (progressInterval) {
          clearInterval(progressInterval);
          cleanupRef.current.intervals.delete(progressInterval);
        }
      }
    };

    try {
      youtubePlayer.addEventListener('onStateChange', handleStateChange);
      cleanupRef.current.eventListeners.push(() => {
        youtubePlayer.removeEventListener('onStateChange', handleStateChange);
      });
    } catch (error) {
      logger.warn('⚠️ YouTube event setup error:', error);
      setVideoState(prev => ({ ...prev, hasError: true }));
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [youtubePlayer, videoType, updateProgress, handleVideoEnded, unitId, shouldTrackPerformance]);

  // Regular video player management
  useEffect(() => {
    if (videoType !== 'upload' || !videoElement) return;

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      updateProgress(currentTime, duration);
    };

    const handlePlay = () => {
      setVideoState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setVideoState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setVideoState(prev => ({ ...prev, isCompleted: true, isPlaying: false }));
      handleVideoEnded();
    };

    const handleError = () => {
      setVideoState(prev => ({ ...prev, hasError: true }));
      logger.warn('⚠️ Video playback error');
    };

    // Add event listeners with passive option for performance
    const eventOptions = { passive: true };
    videoElement.addEventListener('timeupdate', handleTimeUpdate, eventOptions);
    videoElement.addEventListener('play', handlePlay, eventOptions);
    videoElement.addEventListener('pause', handlePause, eventOptions);
    videoElement.addEventListener('ended', handleEnded, eventOptions);
    videoElement.addEventListener('error', handleError, eventOptions);

    const cleanup = () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };

    cleanupRef.current.eventListeners.push(cleanup);
    return cleanup;
  }, [videoElement, videoType, updateProgress, handleVideoEnded]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals
      cleanupRef.current.intervals.forEach(interval => {
        clearInterval(interval);
      });

      // Clear all timeouts
      cleanupRef.current.timeouts.forEach(timeout => {
        clearTimeout(timeout);
      });

      // Execute all event listener cleanups
      cleanupRef.current.eventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          if (shouldTrackPerformance) {
            logger.warn('⚠️ Cleanup error:', error);
          }
        }
      });

      // Clear progress update timeout
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
      }
    };
  }, [shouldTrackPerformance]);

  // Compute final state
  const isVideoCompleted = videoProgress.is_completed || completionState.isCompleted || videoState.isCompleted;
  const displayPercentage = Math.max(
    videoProgress.watch_percentage,
    completionState.watchPercentage,
    videoState.watchPercentage
  );

  return {
    // Combined state
    videoProgress,
    completionState,
    videoState,
    loading,
    
    // Computed values
    isVideoCompleted,
    displayPercentage,
    
    // Actions
    forceComplete,
    
    // Performance data (only in development)
    performanceData: shouldTrackPerformance ? {
      totalTimeouts: cleanupRef.current.timeouts.size,
      totalIntervals: cleanupRef.current.intervals.size,
      totalEventListeners: cleanupRef.current.eventListeners.length
    } : null
  };
};