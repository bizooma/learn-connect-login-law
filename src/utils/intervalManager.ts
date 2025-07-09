// Centralized interval and timeout management to prevent memory leaks
import { useEffect } from 'react';

interface ManagedTimer {
  id: number;
  type: 'interval' | 'timeout';
  callback: () => void;
  delay: number;
  created: number;
  componentId: string;
}

class IntervalManager {
  private timers = new Map<number, ManagedTimer>();
  private componentTimers = new Map<string, Set<number>>();
  private nextId = 1;

  // Create a managed interval
  createInterval(callback: () => void, delay: number, componentId: string): number {
    const id = this.nextId++;
    const timer: ManagedTimer = {
      id,
      type: 'interval',
      callback,
      delay,
      created: Date.now(),
      componentId
    };

    const intervalId = window.setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.warn(`Error in managed interval ${id}:`, error);
        this.clearTimer(id);
      }
    }, delay);

    this.timers.set(id, timer);
    
    if (!this.componentTimers.has(componentId)) {
      this.componentTimers.set(componentId, new Set());
    }
    this.componentTimers.get(componentId)!.add(id);

    // Store the actual interval ID for cleanup
    timer.id = intervalId;
    return intervalId;
  }

  // Create a managed timeout
  createTimeout(callback: () => void, delay: number, componentId: string): number {
    const id = this.nextId++;
    const timer: ManagedTimer = {
      id,
      type: 'timeout',
      callback,
      delay,
      created: Date.now(),
      componentId
    };

    const timeoutId = window.setTimeout(() => {
      try {
        callback();
      } catch (error) {
        console.warn(`Error in managed timeout ${id}:`, error);
      } finally {
        this.clearTimer(id);
      }
    }, delay);

    this.timers.set(id, timer);
    
    if (!this.componentTimers.has(componentId)) {
      this.componentTimers.set(componentId, new Set());
    }
    this.componentTimers.get(componentId)!.add(id);

    // Store the actual timeout ID for cleanup
    timer.id = timeoutId;
    return timeoutId;
  }

  // Clear a specific timer
  clearTimer(timerId: number): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;

    if (timer.type === 'interval') {
      clearInterval(timer.id);
    } else {
      clearTimeout(timer.id);
    }

    // Remove from component tracking
    const componentTimers = this.componentTimers.get(timer.componentId);
    if (componentTimers) {
      componentTimers.delete(timerId);
      if (componentTimers.size === 0) {
        this.componentTimers.delete(timer.componentId);
      }
    }

    this.timers.delete(timerId);
  }

  // Clear all timers for a specific component
  clearComponentTimers(componentId: string): void {
    const timerIds = this.componentTimers.get(componentId);
    if (!timerIds) return;

    timerIds.forEach(timerId => {
      const timer = this.timers.get(timerId);
      if (timer) {
        if (timer.type === 'interval') {
          clearInterval(timer.id);
        } else {
          clearTimeout(timer.id);
        }
        this.timers.delete(timerId);
      }
    });

    this.componentTimers.delete(componentId);
  }

  // Clear all timers (emergency cleanup)
  clearAllTimers(): void {
    this.timers.forEach(timer => {
      if (timer.type === 'interval') {
        clearInterval(timer.id);
      } else {
        clearTimeout(timer.id);
      }
    });

    this.timers.clear();
    this.componentTimers.clear();
  }

  // Get diagnostics for debugging
  getDiagnostics(): {
    totalTimers: number;
    intervalCount: number;
    timeoutCount: number;
    componentBreakdown: Record<string, number>;
    oldestTimer: number | null;
  } {
    const intervals = Array.from(this.timers.values()).filter(t => t.type === 'interval');
    const timeouts = Array.from(this.timers.values()).filter(t => t.type === 'timeout');
    
    const componentBreakdown: Record<string, number> = {};
    this.componentTimers.forEach((timers, componentId) => {
      componentBreakdown[componentId] = timers.size;
    });

    const oldestTimer = this.timers.size > 0 
      ? Math.min(...Array.from(this.timers.values()).map(t => t.created))
      : null;

    return {
      totalTimers: this.timers.size,
      intervalCount: intervals.length,
      timeoutCount: timeouts.length,
      componentBreakdown,
      oldestTimer: oldestTimer ? Date.now() - oldestTimer : null
    };
  }

  // Detect potential memory leaks
  detectLeaks(): Array<{componentId: string; timerCount: number; oldestAge: number}> {
    const leaks: Array<{componentId: string; timerCount: number; oldestAge: number}> = [];
    const now = Date.now();

    this.componentTimers.forEach((timerIds, componentId) => {
      if (timerIds.size > 5) { // More than 5 timers per component is suspicious
        const componentTimers = Array.from(timerIds)
          .map(id => this.timers.get(id))
          .filter(Boolean) as ManagedTimer[];
        
        const oldestAge = Math.max(...componentTimers.map(t => now - t.created));
        
        if (oldestAge > 300000) { // Older than 5 minutes
          leaks.push({
            componentId,
            timerCount: timerIds.size,
            oldestAge
          });
        }
      }
    });

    return leaks;
  }
}

// Global instance
export const intervalManager = new IntervalManager();

// React hook for managed timers
export const useManagedTimers = (componentId: string) => {
  const createInterval = (callback: () => void, delay: number) => {
    return intervalManager.createInterval(callback, delay, componentId);
  };

  const createTimeout = (callback: () => void, delay: number) => {
    return intervalManager.createTimeout(callback, delay, componentId);
  };

  const clearTimer = (timerId: number) => {
    intervalManager.clearTimer(timerId);
  };

  const clearAllComponentTimers = () => {
    intervalManager.clearComponentTimers(componentId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalManager.clearComponentTimers(componentId);
    };
  }, [componentId]);

  return {
    createInterval,
    createTimeout,
    clearTimer,
    clearAllComponentTimers
  };
};

// Development tools
export const timerDiagnostics = {
  getDiagnostics: () => intervalManager.getDiagnostics(),
  detectLeaks: () => intervalManager.detectLeaks(),
  clearAll: () => intervalManager.clearAllTimers(),
  logStatus: () => {
    const diagnostics = intervalManager.getDiagnostics();
    console.group('🔧 Timer Manager Status');
    console.log('Total timers:', diagnostics.totalTimers);
    console.log('Intervals:', diagnostics.intervalCount);
    console.log('Timeouts:', diagnostics.timeoutCount);
    console.log('Component breakdown:', diagnostics.componentBreakdown);
    if (diagnostics.oldestTimer) {
      console.log('Oldest timer age:', Math.round(diagnostics.oldestTimer / 1000), 'seconds');
    }
    
    const leaks = intervalManager.detectLeaks();
    if (leaks.length > 0) {
      console.warn('Potential memory leaks detected:', leaks);
    }
    console.groupEnd();
  }
};

// Global cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    intervalManager.clearAllTimers();
  });
}