import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface VideoStabilityMetrics {
  loadAttempts: number;
  loadFailures: number;
  playbackErrors: number;
  freezeEvents: number;
  memoryUsage: number;
  lastError: string | null;
  videoType: 'youtube' | 'upload' | 'unknown';
}

interface UseVideoStabilityMonitorProps {
  videoId?: string;
  videoType?: 'youtube' | 'upload';
  onStabilityIssue?: (metrics: VideoStabilityMetrics) => void;
}

export const useVideoStabilityMonitor = ({ 
  videoId, 
  videoType = 'upload',
  onStabilityIssue 
}: UseVideoStabilityMonitorProps) => {
  const metricsRef = useRef<VideoStabilityMetrics>({
    loadAttempts: 0,
    loadFailures: 0,
    playbackErrors: 0,
    freezeEvents: 0,
    memoryUsage: 0,
    lastError: null,
    videoType: videoType as 'youtube' | 'upload' | 'unknown'
  });

  const stabilityCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastProgressTime = useRef<number>(Date.now());
  const progressStallThreshold = 30000; // 30 seconds

  // Track video load attempts
  const trackLoadAttempt = useCallback(() => {
    metricsRef.current.loadAttempts++;
    logger.log('📊 Video load attempt:', { 
      videoId, 
      attempts: metricsRef.current.loadAttempts 
    });
  }, [videoId]);

  // Track video load failures
  const trackLoadFailure = useCallback((error: string) => {
    metricsRef.current.loadFailures++;
    metricsRef.current.lastError = error;
    
    logger.error('❌ Video load failure:', { 
      videoId, 
      error, 
      failures: metricsRef.current.loadFailures 
    });

    // Alert if too many failures
    if (metricsRef.current.loadFailures >= 3) {
      onStabilityIssue?.(metricsRef.current);
    }
  }, [videoId, onStabilityIssue]);

  // Track playback errors
  const trackPlaybackError = useCallback((error: string) => {
    metricsRef.current.playbackErrors++;
    metricsRef.current.lastError = error;
    
    logger.error('🔥 Video playback error:', { 
      videoId, 
      error, 
      playbackErrors: metricsRef.current.playbackErrors 
    });

    if (metricsRef.current.playbackErrors >= 2) {
      onStabilityIssue?.(metricsRef.current);
    }
  }, [videoId, onStabilityIssue]);

  // Track potential freeze events
  const trackProgressUpdate = useCallback(() => {
    lastProgressTime.current = Date.now();
  }, []);

  // Check for video freezes
  const checkForFreeze = useCallback(() => {
    const timeSinceLastProgress = Date.now() - lastProgressTime.current;
    
    if (timeSinceLastProgress > progressStallThreshold) {
      metricsRef.current.freezeEvents++;
      
      logger.warn('🧊 Potential video freeze detected:', { 
        videoId, 
        stallTime: timeSinceLastProgress,
        freezeEvents: metricsRef.current.freezeEvents 
      });

      // Reset timer to avoid repeated alerts
      lastProgressTime.current = Date.now();
      
      if (metricsRef.current.freezeEvents >= 2) {
        onStabilityIssue?.(metricsRef.current);
      }
    }
  }, [videoId, onStabilityIssue]);

  // Monitor memory usage for video-related memory leaks
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      metricsRef.current.memoryUsage = memInfo.usedJSHeapSize;
      
      // Alert on high memory usage (>50MB for video components)
      if (memInfo.usedJSHeapSize > 50 * 1024 * 1024) {
        logger.warn('🧠 High memory usage detected in video component:', {
          videoId,
          memoryMB: Math.round(memInfo.usedJSHeapSize / 1024 / 1024)
        });
      }
    }
  }, [videoId]);

  // Start stability monitoring
  useEffect(() => {
    if (!videoId) return;

    stabilityCheckInterval.current = setInterval(() => {
      checkForFreeze();
      checkMemoryUsage();
    }, 10000); // Check every 10 seconds

    return () => {
      if (stabilityCheckInterval.current) {
        clearInterval(stabilityCheckInterval.current);
      }
    };
  }, [videoId, checkForFreeze, checkMemoryUsage]);

  // Reset metrics when video changes
  useEffect(() => {
    metricsRef.current = {
      loadAttempts: 0,
      loadFailures: 0,
      playbackErrors: 0,
      freezeEvents: 0,
      memoryUsage: 0,
      lastError: null,
      videoType
    };
    lastProgressTime.current = Date.now();
  }, [videoId, videoType]);

  const getStabilityReport = useCallback(() => {
    const metrics = metricsRef.current;
    const overallHealth = 
      metrics.loadFailures === 0 && 
      metrics.playbackErrors === 0 && 
      metrics.freezeEvents < 2 ? 'healthy' : 
      metrics.loadFailures < 3 && 
      metrics.playbackErrors < 2 && 
      metrics.freezeEvents < 3 ? 'warning' : 'critical';

    return {
      ...metrics,
      overallHealth,
      timestamp: new Date().toISOString()
    };
  }, []);

  return {
    trackLoadAttempt,
    trackLoadFailure,
    trackPlaybackError,
    trackProgressUpdate,
    getStabilityReport,
    metrics: metricsRef.current
  };
};