import { useEffect, useRef, useCallback, useState } from 'react';
import { usePerformanceTracking } from './usePerformanceTracking';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface ComponentMetrics {
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  slowRenders: number;
  mountTime: number;
  lastRenderTime: number;
}

export const useComponentPerformance = (componentName: string) => {
  const { trackRenderStart, trackRenderEnd, trackComponentMount } = usePerformanceTracking();
  const renderTimesRef = useRef<number[]>([]);
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const lastRenderRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<ComponentMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowRenders: 0,
    mountTime: 0,
    lastRenderTime: 0
  });

  // Track component mount
  useEffect(() => {
    const mountStart = performance.now();
    trackComponentMount(componentName);
    
    return () => {
      const mountEnd = performance.now();
      mountTimeRef.current = mountEnd - mountStart;
    };
  }, [componentName, trackComponentMount]);

  // Track render performance
  const trackRender = useCallback(() => {
    const renderStart = performance.now();
    trackRenderStart();
    
    return () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      trackRenderEnd(componentName);
      
      // Update performance metrics
      renderCountRef.current++;
      renderTimesRef.current.push(renderTime);
      lastRenderRef.current = renderTime;
      
      // Keep only last 100 renders for memory efficiency
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current = renderTimesRef.current.slice(-100);
      }
      
      const totalTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / renderTimesRef.current.length;
      const slowRenders = renderTimesRef.current.filter(time => time > 16).length; // 60fps threshold
      
      // Track optimization opportunity
      if (renderTime > 32) { // 30fps threshold
        optimizationTracker.trackOptimization(
          `SlowRender_${componentName}`,
          'memory_optimization',
          renderTime - 16, // Time over 60fps budget
          renderTime,
          1
        );
      }
      
      setMetrics({
        renderCount: renderCountRef.current,
        averageRenderTime: averageTime,
        totalRenderTime: totalTime,
        slowRenders,
        mountTime: mountTimeRef.current,
        lastRenderTime: renderTime
      });
    };
  }, [componentName, trackRenderStart, trackRenderEnd]);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.averageRenderTime > 16) {
      recommendations.push('Consider memoizing expensive calculations with useMemo');
    }
    
    if (metrics.slowRenders > metrics.renderCount * 0.2) {
      recommendations.push('High percentage of slow renders - check for unnecessary re-renders');
    }
    
    if (metrics.renderCount > 50 && metrics.averageRenderTime > 8) {
      recommendations.push('Frequently re-rendering component - consider splitting into smaller components');
    }
    
    if (metrics.mountTime > 100) {
      recommendations.push('Slow component mount - consider lazy loading or code splitting');
    }
    
    return recommendations;
  }, [metrics]);

  const getPerformanceGrade = useCallback(() => {
    if (metrics.averageRenderTime < 8) return 'A';
    if (metrics.averageRenderTime < 16) return 'B';
    if (metrics.averageRenderTime < 32) return 'C';
    if (metrics.averageRenderTime < 50) return 'D';
    return 'F';
  }, [metrics.averageRenderTime]);

  return {
    metrics,
    trackRender,
    getRecommendations,
    getPerformanceGrade
  };
};
