// Render Performance Monitor
// Tracks React component render cycles and optimization metrics

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  wastedRenders: number;
}

class RenderPerformanceMonitor {
  private metrics = new Map<string, RenderMetrics>();
  private renderStartTimes = new Map<string, number>();

  // Track component render start
  startRender(componentName: string): void {
    this.renderStartTimes.set(componentName, performance.now());
  }

  // Track component render end and calculate metrics
  endRender(componentName: string, wasNecessary: boolean = true): void {
    const startTime = this.renderStartTimes.get(componentName);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.renderStartTimes.delete(componentName);

    const existing = this.metrics.get(componentName) || {
      componentName,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      wastedRenders: 0
    };

    existing.renderCount++;
    existing.lastRenderTime = renderTime;
    existing.totalRenderTime += renderTime;
    existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
    
    if (!wasNecessary) {
      existing.wastedRenders++;
    }

    this.metrics.set(componentName, existing);

    // Log significant performance issues
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }

    if (existing.wastedRenders > 5) {
      console.warn(`Frequent unnecessary renders: ${componentName} has ${existing.wastedRenders} wasted renders`);
    }
  }

  // Get metrics for a specific component
  getComponentMetrics(componentName: string): RenderMetrics | null {
    return this.metrics.get(componentName) || null;
  }

  // Get all performance metrics
  getAllMetrics(): RenderMetrics[] {
    return Array.from(this.metrics.values()).sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalComponents: number;
    slowComponents: string[];
    wastefulComponents: string[];
    averageRenderTime: number;
    totalWastedRenders: number;
  } {
    const allMetrics = this.getAllMetrics();
    const slowComponents = allMetrics
      .filter(m => m.averageRenderTime > 10)
      .map(m => m.componentName);
    
    const wastefulComponents = allMetrics
      .filter(m => m.wastedRenders > 3)
      .map(m => m.componentName);

    const totalRenderTime = allMetrics.reduce((sum, m) => sum + m.totalRenderTime, 0);
    const totalRenders = allMetrics.reduce((sum, m) => sum + m.renderCount, 0);
    const totalWastedRenders = allMetrics.reduce((sum, m) => sum + m.wastedRenders, 0);

    return {
      totalComponents: allMetrics.length,
      slowComponents,
      wastefulComponents,
      averageRenderTime: totalRenders > 0 ? totalRenderTime / totalRenders : 0,
      totalWastedRenders
    };
  }

  // Reset all metrics
  reset(): void {
    this.metrics.clear();
    this.renderStartTimes.clear();
  }

  // Export metrics for debugging
  exportMetrics(): string {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }
}

// Global instance
export const renderPerformanceMonitor = new RenderPerformanceMonitor();

// React Hook for easy integration
export const useRenderPerformanceMonitor = (componentName: string) => {
  return {
    startRender: () => renderPerformanceMonitor.startRender(componentName),
    endRender: (wasNecessary?: boolean) => renderPerformanceMonitor.endRender(componentName, wasNecessary),
    getMetrics: () => renderPerformanceMonitor.getComponentMetrics(componentName)
  };
};

// Simple render tracking function for manual integration
export const trackRenderStart = (componentName: string) => {
  renderPerformanceMonitor.startRender(componentName);
};

export const trackRenderEnd = (componentName: string, wasNecessary?: boolean) => {
  renderPerformanceMonitor.endRender(componentName, wasNecessary);
};