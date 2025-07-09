// Render Performance Debugging Tools
// Advanced debugging utilities for React component performance

import React from 'react';

interface RenderTrace {
  componentName: string;
  startTime: number;
  endTime: number;
  duration: number;
  props: any;
  wasNecessary: boolean;
  stackTrace: string;
}

interface PerformanceSnapshot {
  timestamp: number;
  totalComponents: number;
  slowComponents: string[];
  averageRenderTime: number;
  memoryUsage: number;
  renderTraces: RenderTrace[];
}

class RenderDebugger {
  private traces: RenderTrace[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private isRecording: boolean = false;
  private maxTraces: number = 1000;

  // Start recording render cycles
  startRecording(): void {
    this.isRecording = true;
    this.traces = [];
    console.log('🎬 Render debugging started');
  }

  // Stop recording and generate report
  stopRecording(): PerformanceSnapshot {
    this.isRecording = false;
    const snapshot = this.takeSnapshot();
    console.log('🛑 Render debugging stopped');
    this.generateReport(snapshot);
    return snapshot;
  }

  // Record a render trace
  recordTrace(
    componentName: string,
    startTime: number,
    endTime: number,
    props: any,
    wasNecessary: boolean = true
  ): void {
    if (!this.isRecording) return;

    const trace: RenderTrace = {
      componentName,
      startTime,
      endTime,
      duration: endTime - startTime,
      props: this.serializeProps(props),
      wasNecessary,
      stackTrace: this.getStackTrace()
    };

    this.traces.push(trace);

    // Limit trace history for memory management
    if (this.traces.length > this.maxTraces) {
      this.traces.shift();
    }

    // Log significant issues immediately
    if (trace.duration > 16) {
      console.warn(`⚠️ Slow render: ${componentName} (${trace.duration.toFixed(2)}ms)`);
    }

    if (!wasNecessary) {
      console.warn(`💸 Unnecessary render: ${componentName}`);
    }
  }

  // Take performance snapshot
  takeSnapshot(): PerformanceSnapshot {
    const now = performance.now();
    const recentTraces = this.traces.filter(t => now - t.endTime < 5000); // Last 5 seconds
    
    const slowComponents = recentTraces
      .filter(t => t.duration > 10)
      .map(t => t.componentName)
      .filter((name, index, arr) => arr.indexOf(name) === index);

    const averageRenderTime = recentTraces.length > 0
      ? recentTraces.reduce((sum, t) => sum + t.duration, 0) / recentTraces.length
      : 0;

    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      totalComponents: new Set(recentTraces.map(t => t.componentName)).size,
      slowComponents,
      averageRenderTime,
      memoryUsage: this.getMemoryUsage(),
      renderTraces: recentTraces
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  // Generate comprehensive performance report
  generateReport(snapshot: PerformanceSnapshot): void {
    console.group('📊 Render Performance Report');
    
    console.log(`⏱️ Average render time: ${snapshot.averageRenderTime.toFixed(2)}ms`);
    console.log(`🧩 Total components rendered: ${snapshot.totalComponents}`);
    console.log(`🐌 Slow components: ${snapshot.slowComponents.length}`);
    console.log(`💾 Memory usage: ${snapshot.memoryUsage.toFixed(2)}MB`);

    if (snapshot.slowComponents.length > 0) {
      console.group('🐌 Slow Components');
      snapshot.slowComponents.forEach(component => {
        const componentTraces = snapshot.renderTraces.filter(t => t.componentName === component);
        const avgTime = componentTraces.reduce((sum, t) => sum + t.duration, 0) / componentTraces.length;
        console.log(`${component}: ${avgTime.toFixed(2)}ms average`);
      });
      console.groupEnd();
    }

    const unnecessaryRenders = snapshot.renderTraces.filter(t => !t.wasNecessary);
    if (unnecessaryRenders.length > 0) {
      console.group('💸 Unnecessary Renders');
      const wasteByComponent = unnecessaryRenders.reduce((acc, trace) => {
        acc[trace.componentName] = (acc[trace.componentName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(wasteByComponent)
        .sort(([,a], [,b]) => b - a)
        .forEach(([component, count]) => {
          console.log(`${component}: ${count} unnecessary renders`);
        });
      console.groupEnd();
    }

    console.groupEnd();
  }

  // Get component-specific analysis
  analyzeComponent(componentName: string): {
    totalRenders: number;
    averageRenderTime: number;
    unnecessaryRenders: number;
    slowRenders: number;
    recommendations: string[];
  } {
    const componentTraces = this.traces.filter(t => t.componentName === componentName);
    
    if (componentTraces.length === 0) {
      return {
        totalRenders: 0,
        averageRenderTime: 0,
        unnecessaryRenders: 0,
        slowRenders: 0,
        recommendations: ['No render data available for this component']
      };
    }

    const totalRenders = componentTraces.length;
    const averageRenderTime = componentTraces.reduce((sum, t) => sum + t.duration, 0) / totalRenders;
    const unnecessaryRenders = componentTraces.filter(t => !t.wasNecessary).length;
    const slowRenders = componentTraces.filter(t => t.duration > 16).length;

    const recommendations: string[] = [];
    
    if (averageRenderTime > 10) {
      recommendations.push('Consider memoizing expensive calculations with useMemo');
    }
    
    if (unnecessaryRenders > totalRenders * 0.3) {
      recommendations.push('High rate of unnecessary renders - check dependencies in useEffect/useMemo');
    }
    
    if (slowRenders > 0) {
      recommendations.push('Some renders are slow - consider code splitting or virtualization');
    }

    return {
      totalRenders,
      averageRenderTime,
      unnecessaryRenders,
      slowRenders,
      recommendations
    };
  }

  // Export traces for external analysis
  exportTraces(): string {
    return JSON.stringify(this.traces, null, 2);
  }

  // Clear all data
  clear(): void {
    this.traces = [];
    this.snapshots = [];
  }

  private serializeProps(props: any): any {
    try {
      return JSON.parse(JSON.stringify(props));
    } catch {
      return '[Non-serializable props]';
    }
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(0, 5).join('\n') : '';
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }
}

// Global debugger instance
export const renderDebugger = new RenderDebugger();

// React hook for component-level debugging
export const useRenderDebugger = (componentName: string, props?: any) => {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();
  });

  React.useEffect(() => {
    const endTime = performance.now();
    renderDebugger.recordTrace(
      componentName,
      startTime.current,
      endTime,
      props,
      true // Assume necessary unless proven otherwise
    );
  });

  return {
    markUnnecessary: () => {
      const endTime = performance.now();
      renderDebugger.recordTrace(
        componentName,
        startTime.current,
        endTime,
        props,
        false
      );
    }
  };
};

// Performance testing utilities
export const performanceTest = {
  // Measure component render time
  measureRender: async (
    component: React.ComponentType<any>,
    props: any,
    iterations: number = 100
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  }> => {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate render
      const testContainer = document.createElement('div');
      const root = (await import('react-dom/client')).createRoot(testContainer);
      root.render(React.createElement(component, props));
      
      const end = performance.now();
      times.push(end - start);
      
      root.unmount();
    }

    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((sum, time) => sum + time, 0)
    };
  },

  // Benchmark multiple components
  benchmark: async (components: Array<{
    name: string;
    component: React.ComponentType<any>;
    props: any;
  }>): Promise<Array<{
    name: string;
    averageTime: number;
    score: number;
  }>> => {
    const results = [];
    
    for (const { name, component, props } of components) {
      const metrics = await performanceTest.measureRender(component, props, 50);
      results.push({
        name,
        averageTime: metrics.averageTime,
        score: Math.max(0, 100 - metrics.averageTime) // Higher score is better
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }
};

// Global debugging controls
export const debugControls = {
  start: () => renderDebugger.startRecording(),
  stop: () => renderDebugger.stopRecording(),
  analyze: (componentName: string) => renderDebugger.analyzeComponent(componentName),
  export: () => renderDebugger.exportTraces(),
  clear: () => renderDebugger.clear()
};