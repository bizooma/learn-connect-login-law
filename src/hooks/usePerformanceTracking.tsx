import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
}

export const usePerformanceTracking = () => {
  const location = useLocation();
  const renderStartRef = useRef<number>(0);
  const componentCountRef = useRef<number>(0);

  // Track route changes with optimization data
  useEffect(() => {
    const routeName = location.pathname.replace('/', '') || 'home';
    const start = performance.now();
    
    performanceMonitor.trackRouteChange(routeName);
    
    // Track route change performance
    const routeChangeTime = performance.now() - start;
    if (routeChangeTime > 100) { // Only track slow route changes
      optimizationTracker.trackOptimization(
        `RouteChange_${routeName}`,
        'memory_optimization',
        0,
        routeChangeTime
      );
    }
  }, [location.pathname]);

  // Track bundle sizes on mount with optimization tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      performanceMonitor.trackBundleSize();
      const bundleTrackingTime = performance.now() - start;
      
      if (bundleTrackingTime > 50) {
        optimizationTracker.trackOptimization(
          'BundleSizeTracking',
          'memory_optimization',
          0,
          bundleTrackingTime
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Enhanced render tracking for component performance
  const trackRenderStart = useCallback(() => {
    renderStartRef.current = performance.now();
    componentCountRef.current = 0;
  }, []);

  const trackRenderEnd = useCallback((componentName: string) => {
    if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current;
      
      if (renderTime > 16) { // Track renders slower than 60fps
        optimizationTracker.trackOptimization(
          `Render_${componentName}`,
          'memory_optimization',
          0,
          renderTime,
          componentCountRef.current
        );
      }
      
      renderStartRef.current = 0;
    }
  }, []);

  const trackComponentMount = useCallback((componentName: string) => {
    componentCountRef.current++;
    
    // Track memory usage if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
        optimizationTracker.trackOptimization(
          `MemoryUsage_${componentName}`,
          'memory_optimization',
          0,
          memoryInfo.usedJSHeapSize / 1024 / 1024, // Convert to MB
          1
        );
      }
    }
  }, []);

  // Get comprehensive metrics including optimization data
  const getMetrics = useCallback((): PerformanceMetrics & { optimizationStats: any } => {
    const baseMetrics = performanceMonitor.getMetrics();
    const optimizationStats = optimizationTracker.getPerformanceStats(60 * 60 * 1000); // Last hour
    
    return {
      renderTime: renderStartRef.current > 0 ? performance.now() - renderStartRef.current : 0,
      componentCount: componentCountRef.current,
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : 0,
      optimizationStats,
      ...baseMetrics
    };
  }, []);

  // Get optimization report for debugging
  const getOptimizationReport = useCallback(() => {
    return optimizationTracker.getDailyReport();
  }, []);
  
  return { 
    getMetrics, 
    getOptimizationReport,
    trackRenderStart,
    trackRenderEnd,
    trackComponentMount
  };
};