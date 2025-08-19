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
  const progressStallThreshold = 60000; // PHASE 1: Increased from 30s to 60s
  const circuitBreakerRef = useRef<boolean>(false);

  // Track video load attempts
  const trackLoadAttempt = useCallback(() => {
    metricsRef.current.loadAttempts++;
    logger.log('📊 Video load attempt:', { 
      videoId, 
      attempts: metricsRef.current.loadAttempts 
    });
  }, [videoId]);

  // Track video load failures - PHASE 1: Increased threshold from 3 to 8
  const trackLoadFailure = useCallback((error: string) => {
    metricsRef.current.loadFailures++;
    metricsRef.current.lastError = error;
    
    logger.error('❌ Video load failure:', { 
      videoId, 
      error, 
      failures: metricsRef.current.loadFailures 
    });

    // PHASE 1: Only alert if excessive failures (8+) and circuit breaker not active
    if (metricsRef.current.loadFailures >= 8 && !circuitBreakerRef.current) {
      onStabilityIssue?.(metricsRef.current);
      // Activate circuit breaker to prevent spam
      circuitBreakerRef.current = true;
      setTimeout(() => {
        circuitBreakerRef.current = false;
      }, 300000); // Reset after 5 minutes
    }
  }, [videoId, onStabilityIssue]);

  // Track playback errors - PHASE 1: Increased threshold from 2 to 5
  const trackPlaybackError = useCallback((error: string) => {
    metricsRef.current.playbackErrors++;
    metricsRef.current.lastError = error;
    
    logger.error('🔥 Video playback error:', { 
      videoId, 
      error, 
      playbackErrors: metricsRef.current.playbackErrors 
    });

    // PHASE 1: Only alert if excessive errors (5+) and circuit breaker not active
    if (metricsRef.current.playbackErrors >= 5 && !circuitBreakerRef.current) {
      onStabilityIssue?.(metricsRef.current);
      circuitBreakerRef.current = true;
      setTimeout(() => {
        circuitBreakerRef.current = false;
      }, 300000); // Reset after 5 minutes
    }
  }, [videoId, onStabilityIssue]);

  // Track potential freeze events
  const trackProgressUpdate = useCallback(() => {
    lastProgressTime.current = Date.now();
  }, []);

  // Check for video freezes - PHASE 1: Increased threshold from 2 to 4
  const checkForFreeze = useCallback(() => {
    if (circuitBreakerRef.current) return; // Skip if circuit breaker active

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
      
      // PHASE 1: Only alert if excessive freeze events (4+)
      if (metricsRef.current.freezeEvents >= 4) {
        onStabilityIssue?.(metricsRef.current);
      }
    }
  }, [videoId, onStabilityIssue]);

  // Monitor memory usage - PHASE 1: Increased threshold from 50MB to 100MB
  const checkMemoryUsage = useCallback(() => {
    if (circuitBreakerRef.current) return; // Skip if circuit breaker active
    
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      metricsRef.current.memoryUsage = memInfo.usedJSHeapSize;
      
      // PHASE 1: Alert on very high memory usage (>100MB for video components)
      if (memInfo.usedJSHeapSize > 100 * 1024 * 1024) {
        logger.warn('🧠 High memory usage detected in video component:', {
          videoId,
          memoryMB: Math.round(memInfo.usedJSHeapSize / 1024 / 1024)
        });
      }
    }
  }, [videoId]);

  // Start stability monitoring - PHASE 1: Reduced frequency from 10s to 30s
  useEffect(() => {
    if (!videoId) return;

    stabilityCheckInterval.current = setInterval(() => {
      checkForFreeze();
      checkMemoryUsage();
    }, 30000); // PHASE 1: Check every 30 seconds instead of 10

    return () => {
      if (stabilityCheckInterval.current) {
        clearInterval(stabilityCheckInterval.current);
        stabilityCheckInterval.current = null;
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
    circuitBreakerRef.current = false; // Reset circuit breaker
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