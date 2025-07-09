import React, { memo, useMemo } from 'react';
import { renderPerformanceMonitor } from '@/utils/renderPerformanceMonitor';

interface PerformanceBoundaryProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, componentStack: string) => void;
}

interface PerformanceBoundaryState {
  hasError: boolean;
  error?: Error;
}

// High-order component for performance boundaries
class PerformanceBoundaryClass extends React.Component<
  PerformanceBoundaryProps,
  PerformanceBoundaryState
> {
  private renderStartTime: number = 0;

  constructor(props: PerformanceBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PerformanceBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, componentName } = this.props;
    
    // Track performance impact of errors
    renderPerformanceMonitor.endRender(componentName, false);
    
    console.error(`Performance boundary caught error in ${componentName}:`, error);
    onError?.(error, errorInfo.componentStack);
  }

  componentDidMount() {
    this.renderStartTime = performance.now();
    renderPerformanceMonitor.startRender(this.props.componentName);
  }

  componentDidUpdate() {
    const renderTime = performance.now() - this.renderStartTime;
    renderPerformanceMonitor.endRender(this.props.componentName, true);
    
    // Warn about slow renders
    if (renderTime > 16) {
      console.warn(`Slow render detected in ${this.props.componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium">Component Error</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.props.componentName} encountered an error and has been isolated.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export const PerformanceBoundary: React.FC<PerformanceBoundaryProps> = (props) => {
  return <PerformanceBoundaryClass {...props} />;
};

// HOC for memoizing components with performance tracking
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Unknown';
  
  const OptimizedComponent = memo((props: P) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 10) {
        console.warn(`Slow component render: ${displayName} took ${renderTime.toFixed(2)}ms`);
      }
    });

    return (
      <PerformanceBoundary componentName={displayName}>
        <Component {...props} />
      </PerformanceBoundary>
    );
  });

  OptimizedComponent.displayName = `withPerformanceOptimization(${displayName})`;
  return OptimizedComponent;
}

// Utility for memoizing conditional class names
export const useMemoizedClassName = (
  baseClasses: string,
  conditionalClasses: Record<string, boolean>,
  dependencies: React.DependencyList
): string => {
  return useMemo(() => {
    const conditionalClassArray = Object.entries(conditionalClasses)
      .filter(([, condition]) => condition)
      .map(([className]) => className);
    
    return [baseClasses, ...conditionalClassArray].filter(Boolean).join(' ');
  }, dependencies);
};

// Utility for memoizing dynamic styles
export const useMemoizedStyle = (
  styleFunction: () => React.CSSProperties,
  dependencies: React.DependencyList
): React.CSSProperties => {
  return useMemo(styleFunction, dependencies);
};

// React.memo wrapper with custom comparison for complex props
export const memoWithComparison = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, propsAreEqual);
};