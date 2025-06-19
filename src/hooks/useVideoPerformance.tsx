
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
}

export const useVideoPerformance = ({ videoId, onMetricsUpdate }: UseVideoPerformanceProps) => {
  const [metrics, setMetrics] = useState<VideoPerformanceMetrics>({
    loadStartTime: null,
    loadEndTime: null,
    loadDuration: null,
    firstFrameTime: null,
    errorCount: 0,
    retryCount: 0,
    playerState: 'unstarted'
  });

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  const startLoadTimer = useCallback(() => {
    const startTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      loadStartTime: startTime,
      loadEndTime: null,
      loadDuration: null,
      playerState: 'loading'
    }));
  }, []);

  const endLoadTimer = useCallback(() => {
    const endTime = performance.now();
    setMetrics(prev => {
      const loadDuration = prev.loadStartTime ? endTime - prev.loadStartTime : null;
      const newMetrics = {
        ...prev,
        loadEndTime: endTime,
        loadDuration,
        playerState: 'ready'
      };
      
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics);
      }
      
      return newMetrics;
    });
  }, [onMetricsUpdate]);

  const recordFirstFrame = useCallback(() => {
    const frameTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      firstFrameTime: frameTime,
      playerState: 'playing'
    }));
  }, []);

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

  // Log performance data for debugging
  useEffect(() => {
    if (metrics.loadDuration && metrics.loadDuration > 3000) {
      console.warn(`Slow video load detected for ${videoId}:`, {
        duration: `${metrics.loadDuration}ms`,
        errorCount: metrics.errorCount,
        retryCount: metrics.retryCount
      });
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
