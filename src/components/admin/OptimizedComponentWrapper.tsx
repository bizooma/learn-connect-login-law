import React, { memo, forwardRef, useEffect } from 'react';
import { useComponentPerformance } from '@/hooks/useComponentPerformance';

interface OptimizedComponentWrapperProps {
  componentName: string;
  children: React.ReactNode;
  className?: string;
  enableProfiling?: boolean;
  onPerformanceUpdate?: (metrics: any) => void;
}

const OptimizedComponentWrapper = memo(forwardRef<HTMLDivElement, OptimizedComponentWrapperProps>(({
  componentName,
  children,
  className,
  enableProfiling = true,
  onPerformanceUpdate
}, ref) => {
  const { metrics, trackRender, getRecommendations, getPerformanceGrade } = useComponentPerformance(componentName);

  useEffect(() => {
    if (!enableProfiling) return;
    
    const cleanup = trackRender();
    return cleanup;
  });

  useEffect(() => {
    if (enableProfiling && onPerformanceUpdate) {
      onPerformanceUpdate({
        ...metrics,
        recommendations: getRecommendations(),
        grade: getPerformanceGrade()
      });
    }
  }, [metrics, enableProfiling, onPerformanceUpdate, getRecommendations, getPerformanceGrade]);

  // Add performance grade as data attribute for debugging
  const performanceGrade = getPerformanceGrade();
  const dataAttributes = enableProfiling ? {
    'data-component': componentName,
    'data-performance-grade': performanceGrade,
    'data-render-count': metrics.renderCount,
    'data-avg-render-time': Math.round(metrics.averageRenderTime)
  } : {};

  return (
    <div 
      ref={ref}
      className={className}
      {...dataAttributes}
    >
      {children}
    </div>
  );
}));

OptimizedComponentWrapper.displayName = 'OptimizedComponentWrapper';

export default OptimizedComponentWrapper;