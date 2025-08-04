// SYSTEM HEALTH MONITORING (Phase 3)
import { useEffect, useRef } from "react";
import { logger } from "@/utils/logger";

interface PerformanceMetrics {
  memoryUsage?: number;
  renderTime?: number;
  errorCount: number;
  lastError?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export const useSystemHealthMonitor = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    errorCount: 0,
    connectionStatus: 'connected'
  });
  const startTime = useRef<number>(Date.now());

  // Monitor memory usage (if available)
  const checkMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      // Log warning if memory usage is high
      if (metricsRef.current.memoryUsage > 0.8) {
        logger.warn('⚠️ High memory usage detected:', {
          usage: `${(metricsRef.current.memoryUsage * 100).toFixed(1)}%`,
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`
        });
      }
    }
  };

  // Monitor render performance
  const measureRenderTime = () => {
    const renderTime = Date.now() - startTime.current;
    metricsRef.current.renderTime = renderTime;
    
    // Log warning for slow renders
    if (renderTime > 3000) {
      logger.warn('⚠️ Slow render detected:', {
        renderTime: `${renderTime}ms`,
        component: 'SystemHealthMonitor'
      });
    }
  };

  // Global error handler
  const handleGlobalError = (event: ErrorEvent) => {
    metricsRef.current.errorCount++;
    metricsRef.current.lastError = event.error?.message || 'Unknown error';
    
    logger.error('🚨 Global error captured:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
      totalErrors: metricsRef.current.errorCount
    });

    // Emergency reload after too many errors
    if (metricsRef.current.errorCount > 10) {
      logger.error('🚨 Too many errors, triggering emergency reload');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Monitor online/offline status
  const handleConnectionChange = () => {
    const status = navigator.onLine ? 'connected' : 'disconnected';
    metricsRef.current.connectionStatus = status;
    
    logger.info('🌐 Connection status changed:', { status });
  };

  useEffect(() => {
    // Set up monitoring
    const monitoringInterval = setInterval(() => {
      checkMemoryUsage();
      measureRenderTime();
    }, 30000); // Check every 30 seconds

    // Set up global error handling
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      handleGlobalError({
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason
      } as ErrorEvent);
    });

    // Monitor connection status
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Log initial system state
    logger.info('🔍 System health monitoring started:', {
      userAgent: navigator.userAgent,
      connection: navigator.onLine ? 'online' : 'offline',
      timestamp: new Date().toISOString()
    });

    return () => {
      clearInterval(monitoringInterval);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  // Get current health status
  const getHealthStatus = () => {
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      metrics: metricsRef.current,
      timestamp: Date.now()
    };

    // Determine overall health
    if (metricsRef.current.errorCount > 5 || metricsRef.current.memoryUsage > 0.9) {
      health.status = 'critical';
    } else if (metricsRef.current.errorCount > 2 || metricsRef.current.memoryUsage > 0.7) {
      health.status = 'warning';
    }

    return health;
  };

  return {
    metrics: metricsRef.current,
    getHealthStatus
  };
};