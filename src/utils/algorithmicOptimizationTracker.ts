// Performance tracking utility for algorithmic optimizations
interface OptimizationMetrics {
  timestamp: number;
  operation: string;
  beforeMs: number;
  afterMs: number;
  improvementPercent: number;
  recordCount: number;
  algorithmType: 'duplicate_detection' | 'database_batch' | 'parallel_processing' | 'memory_optimization';
}

interface PerformanceStats {
  totalOperations: number;
  averageImprovement: number;
  maxImprovement: number;
  totalTimeSaved: number;
  operationBreakdown: Record<string, number>;
  algorithmBreakdown: Record<string, number>;
}

class AlgorithmicOptimizationTracker {
  private metrics: OptimizationMetrics[] = [];
  private static instance: AlgorithmicOptimizationTracker;

  static getInstance(): AlgorithmicOptimizationTracker {
    if (!this.instance) {
      this.instance = new AlgorithmicOptimizationTracker();
    }
    return this.instance;
  }

  // Track performance improvement for an optimization
  trackOptimization(
    operation: string,
    algorithmType: OptimizationMetrics['algorithmType'],
    beforeMs: number,
    afterMs: number,
    recordCount: number = 0
  ): OptimizationMetrics {
    const improvementPercent = beforeMs > 0 ? ((beforeMs - afterMs) / beforeMs) * 100 : 0;
    
    const metric: OptimizationMetrics = {
      timestamp: Date.now(),
      operation,
      beforeMs,
      afterMs,
      improvementPercent,
      recordCount,
      algorithmType
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory growth
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant improvements in development
    if (import.meta.env.DEV && improvementPercent > 10) {
      console.log(`🚀 Algorithm Optimization: ${operation} improved by ${improvementPercent.toFixed(1)}% (${beforeMs}ms → ${afterMs}ms)`);
    }

    return metric;
  }

  // Get comprehensive performance statistics
  getPerformanceStats(timeRangeMs?: number): PerformanceStats {
    const cutoffTime = timeRangeMs ? Date.now() - timeRangeMs : 0;
    const filteredMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageImprovement: 0,
        maxImprovement: 0,
        totalTimeSaved: 0,
        operationBreakdown: {},
        algorithmBreakdown: {}
      };
    }

    const totalImprovement = filteredMetrics.reduce((sum, m) => sum + m.improvementPercent, 0);
    const totalTimeSaved = filteredMetrics.reduce((sum, m) => sum + (m.beforeMs - m.afterMs), 0);
    const maxImprovement = Math.max(...filteredMetrics.map(m => m.improvementPercent));

    // Operation breakdown
    const operationBreakdown: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1;
    });

    // Algorithm type breakdown
    const algorithmBreakdown: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      const timeSaved = m.beforeMs - m.afterMs;
      algorithmBreakdown[m.algorithmType] = (algorithmBreakdown[m.algorithmType] || 0) + timeSaved;
    });

    return {
      totalOperations: filteredMetrics.length,
      averageImprovement: totalImprovement / filteredMetrics.length,
      maxImprovement,
      totalTimeSaved,
      operationBreakdown,
      algorithmBreakdown
    };
  }

  // Get optimization report for the last 24 hours
  getDailyReport(): string {
    const stats = this.getPerformanceStats(24 * 60 * 60 * 1000); // 24 hours

    if (stats.totalOperations === 0) {
      return "No optimizations tracked in the last 24 hours.";
    }

    const topOperation = Object.entries(stats.operationBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    const topAlgorithm = Object.entries(stats.algorithmBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    return `
📊 Daily Algorithmic Optimization Report

🎯 Performance Gains:
  • Total Operations: ${stats.totalOperations}
  • Average Improvement: ${stats.averageImprovement.toFixed(1)}%
  • Maximum Improvement: ${stats.maxImprovement.toFixed(1)}%
  • Total Time Saved: ${(stats.totalTimeSaved / 1000).toFixed(2)}s

🏆 Top Performers:
  • Most Optimized Operation: ${topOperation?.[0] || 'N/A'} (${topOperation?.[1] || 0} times)
  • Biggest Time Saver: ${topAlgorithm?.[0] || 'N/A'} (${((topAlgorithm?.[1] || 0) / 1000).toFixed(2)}s saved)

🔧 Algorithm Breakdown:
${Object.entries(stats.algorithmBreakdown)
  .map(([type, time]) => `  • ${type}: ${(time / 1000).toFixed(2)}s saved`)
  .join('\n')}
    `.trim();
  }

  // Clear metrics (useful for testing)
  clearMetrics(): void {
    this.metrics = [];
  }

  // Export metrics for analysis
  exportMetrics(): OptimizationMetrics[] {
    return [...this.metrics];
  }
}

// Utility functions for easy tracking
export const optimizationTracker = AlgorithmicOptimizationTracker.getInstance();

// Convenient wrapper for timing optimizations
export const trackOptimizationTime = async <T>(
  operation: string,
  algorithmType: OptimizationMetrics['algorithmType'],
  optimizedFunction: () => Promise<T>,
  legacyFunction?: () => Promise<T>,
  recordCount?: number
): Promise<{ result: T; metrics?: OptimizationMetrics }> => {
  // If legacy function provided, compare performance
  if (legacyFunction) {
    const legacyStart = performance.now();
    await legacyFunction();
    const legacyTime = performance.now() - legacyStart;

    const optimizedStart = performance.now();
    const result = await optimizedFunction();
    const optimizedTime = performance.now() - optimizedStart;

    const metrics = optimizationTracker.trackOptimization(
      operation,
      algorithmType,
      legacyTime,
      optimizedTime,
      recordCount
    );

    return { result, metrics };
  }

  // Just run the optimized function
  const result = await optimizedFunction();
  return { result };
};

// Decorator for automatic optimization tracking
export const trackOptimization = (
  operation: string,
  algorithmType: OptimizationMetrics['algorithmType']
) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const duration = performance.now() - start;

      // Track as an optimized operation (no before/after comparison)
      optimizationTracker.trackOptimization(
        `${operation}:${propertyKey}`,
        algorithmType,
        0, // No "before" time available
        duration,
        args.length > 0 && Array.isArray(args[0]) ? args[0].length : 0
      );

      return result;
    };

    return descriptor;
  };
};

// Memory usage tracking utility
export const trackMemoryOptimization = (operation: string, beforeBytes: number, afterBytes: number) => {
  const improvement = beforeBytes > 0 ? ((beforeBytes - afterBytes) / beforeBytes) * 100 : 0;
  
  if (import.meta.env.DEV && improvement > 10) {
    console.log(`💾 Memory Optimization: ${operation} reduced memory by ${improvement.toFixed(1)}% (${(beforeBytes / 1024 / 1024).toFixed(2)}MB → ${(afterBytes / 1024 / 1024).toFixed(2)}MB)`);
  }

  return optimizationTracker.trackOptimization(
    operation,
    'memory_optimization',
    beforeBytes / 1000, // Convert to "time-like" units for consistency
    afterBytes / 1000,
    0
  );
};
