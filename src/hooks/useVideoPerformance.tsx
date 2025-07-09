
import { useState, useEffect, useRef, useCallback } from 'react';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

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
  enableProductionTracking?: boolean;
}

export const useVideoPerformance = ({ 
  videoId, 
  onMetricsUpdate,
  enableProductionTracking = false 
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
  const performanceThrottleRef = useRef<number>(0);
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Disable excessive tracking in production unless explicitly enabled
  const shouldTrack = !isProduction || enableProductionTracking;

  onMetricsUpdateRef.current = onMetricsUpdate;

  const throttledMetricsUpdate = useCallback((newMetrics: VideoPerformanceMetrics) => {
    if (!shouldTrack) return;
    
    const now = Date.now();
    // Throttle metrics updates to prevent excessive calls (max once per 5 seconds)
    if (now - performanceThrottleRef.current < 5000) return;
    
    performanceThrottleRef.current = now;
    
    if (onMetricsUpdateRef.current) {
      onMetricsUpdateRef.current(newMetrics);
    }
  }, [shouldTrack]);

  const startLoadTimer = useCallback(() => {
    if (!shouldTrack) return;
    
    const startTime = performance.now();
    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        loadStartTime: startTime,
        loadEndTime: null,
        loadDuration: null,
        playerState: 'loading'
      };
      
      // Track optimization opportunity for slow loads
      optimizationTracker.trackOptimization(
        `VideoLoadStart_${videoId}`,
        'memory_optimization',
        0,
        startTime,
        1
      );
      
      return newMetrics;
    });
  }, [shouldTrack, videoId]);

  const endLoadTimer = useCallback(() => {
    if (!shouldTrack) return;
    
    const endTime = performance.now();
    setMetrics(prev => {
      const loadDuration = prev.loadStartTime ? endTime - prev.loadStartTime : null;
      const newMetrics = {
        ...prev,
        loadEndTime: endTime,
        loadDuration,
        playerState: 'ready'
      };
      
      // Track performance issues
      if (loadDuration && loadDuration > 3000) {
        optimizationTracker.trackOptimization(
          `SlowVideoLoad_${videoId}`,
          'memory_optimization',
          loadDuration - 3000, // Time over acceptable threshold
          loadDuration,
          1
        );
      }
      
      throttledMetricsUpdate(newMetrics);
      return newMetrics;
    });
  }, [shouldTrack, videoId, throttledMetricsUpdate]);

  const recordFirstFrame = useCallback(() => {
    if (!shouldTrack) return;
    
    const frameTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      firstFrameTime: frameTime,
      playerState: 'playing'
    }));
  }, [shouldTrack]);

  const recordError = useCallback(() => {
    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        errorCount: prev.errorCount + 1,
        playerState: 'error'
      };
      
      if (shouldTrack) {
        // Track error for optimization opportunities
        optimizationTracker.trackOptimization(
          `VideoError_${videoId}`,
          'memory_optimization',
          1, // Error count
          0,
          1
        );
      }
      
      return newMetrics;
    });
  }, [shouldTrack, videoId]);

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

  // Optimized logging - only in development or when explicitly enabled
  useEffect(() => {
    if (!shouldTrack || !metrics.loadDuration) return;
    
    if (metrics.loadDuration > 3000) {
      console.warn(`Slow video load detected for ${videoId}:`, {
        duration: `${metrics.loadDuration}ms`,
        errorCount: metrics.errorCount,
        retryCount: metrics.retryCount,
        timestamp: new Date().toISOString()
      });
    }
  }, [metrics.loadDuration, metrics.errorCount, metrics.retryCount, videoId, shouldTrack]);

  return {
    metrics: shouldTrack ? metrics : { ...metrics, loadDuration: null, firstFrameTime: null },
    startLoadTimer,
    endLoadTimer,
    recordFirstFrame,
    recordError,
    recordRetry,
    updatePlayerState,
    resetMetrics,
    isTrackingEnabled: shouldTrack
  };
};
