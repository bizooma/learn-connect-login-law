
import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoPerformanceMetrics {
  loadStartTime: number | null;
  loadEndTime: number | null;
  loadDuration: number | null;
  firstFrameTime: number | null;
  errorCount: number;
  retryCount: number;
  playerState: string;
}

interface UseVideoPerformanceProps {
  videoId: string;
  onMetricsUpdate?: (metrics: VideoPerformanceMetrics) => void;
  enableDetailedTracking?: boolean;
}

// Environment and sampling configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const PRODUCTION_SAMPLE_RATE = 0.1; // Track only 10% of events in production
const shouldTrackEvent = () => isDevelopment || Math.random() < PRODUCTION_SAMPLE_RATE;

export const useVideoPerformance = ({ 
  videoId, 
  onMetricsUpdate, 
  enableDetailedTracking = isDevelopment 
}: UseVideoPerformanceProps) => {
  const [metrics, setMetrics] = useState<VideoPerformanceMetrics>({
    loadStartTime: null,
    loadEndTime: null,
    loadDuration: null,
    firstFrameTime: null,
    errorCount: 0,
    retryCount: 0,
    playerState: 'unstarted'
  });

  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  const metricsUpdateTimeoutRef = useRef<number>();
  
  onMetricsUpdateRef.current = onMetricsUpdate;

  const startLoadTimer = useCallback(() => {
    if (!shouldTrackEvent()) return;
    
    const startTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      loadStartTime: startTime,
      loadEndTime: null,
      loadDuration: null,
      playerState: 'loading'
    }));
  }, []);

  // Debounced metrics update to prevent excessive calls
  const debouncedMetricsUpdate = useCallback((newMetrics: VideoPerformanceMetrics) => {
    if (metricsUpdateTimeoutRef.current) {
      clearTimeout(metricsUpdateTimeoutRef.current);
    }
    
    metricsUpdateTimeoutRef.current = window.setTimeout(() => {
      if (onMetricsUpdateRef.current) {
        onMetricsUpdateRef.current(newMetrics);
      }
    }, 500); // Debounce updates by 500ms
  }, []);

  const endLoadTimer = useCallback(() => {
    if (!shouldTrackEvent()) return;
    
    const endTime = performance.now();
    setMetrics(prev => {
      const loadDuration = prev.loadStartTime ? endTime - prev.loadStartTime : null;
      const newMetrics = {
        ...prev,
        loadEndTime: endTime,
        loadDuration,
        playerState: 'ready'
      };
      
      debouncedMetricsUpdate(newMetrics);
      return newMetrics;
    });
  }, [debouncedMetricsUpdate]);

  const recordFirstFrame = useCallback(() => {
    if (!enableDetailedTracking) return;
    
    const frameTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      firstFrameTime: frameTime,
      playerState: 'playing'
    }));
  }, [enableDetailedTracking]);

  const recordError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      playerState: 'error'
    }));
  }, []);

  const recordRetry = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      playerState: 'retrying'
    }));
  }, []);

  const updatePlayerState = useCallback((state: string) => {
    setMetrics(prev => ({
      ...prev,
      playerState: state
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      loadStartTime: null,
      loadEndTime: null,
      loadDuration: null,
      firstFrameTime: null,
      errorCount: 0,
      retryCount: 0,
      playerState: 'unstarted'
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (metricsUpdateTimeoutRef.current) {
        clearTimeout(metricsUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Log performance data for debugging (only in development or sampled production)
  useEffect(() => {
    if (!shouldTrackEvent()) return;
    
    if (metrics.loadDuration && metrics.loadDuration > 3000) {
      if (isDevelopment) {
        console.warn(`Slow video load detected for ${videoId}:`, {
          duration: `${metrics.loadDuration}ms`,
          errorCount: metrics.errorCount,
          retryCount: metrics.retryCount
        });
      }
    }
  }, [metrics.loadDuration, metrics.errorCount, metrics.retryCount, videoId]);

  return {
    metrics,
    startLoadTimer,
    endLoadTimer,
    recordFirstFrame,
    recordError,
    recordRetry,
    updatePlayerState,
    resetMetrics
  };
};
