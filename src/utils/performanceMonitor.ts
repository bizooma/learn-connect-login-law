// Performance monitoring utilities for Core Web Vitals
class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, number> = new Map();
  private observer: PerformanceObserver | null = null;

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
    }
  }

  private initializeObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe Core Web Vitals
      this.observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });

      // Observe navigation timing
      this.observer.observe({ 
        entryTypes: ['navigation'] 
      });

      // Observe resource loading
      this.observer.observe({ 
        entryTypes: ['resource'] 
      });

    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.metrics.set('LCP', entry.startTime);
        this.reportMetric('LCP', entry.startTime);
        break;
      
      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        const fid = fidEntry.processingStart - fidEntry.startTime;
        this.metrics.set('FID', fid);
        this.reportMetric('FID', fid);
        break;
      
      case 'layout-shift':
        const clsEntry = entry as any; // CLS entry type
        if (!clsEntry.hadRecentInput) {
          const currentCLS = this.metrics.get('CLS') || 0;
          this.metrics.set('CLS', currentCLS + clsEntry.value);
          this.reportMetric('CLS', currentCLS + clsEntry.value);
        }
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.metrics.set('TTFB', ttfb);
        this.reportMetric('TTFB', ttfb);
        break;
    }
  }

  private reportMetric(name: string, value: number) {
    // In development, log to console
    if (import.meta.env.DEV) {
      const status = this.getMetricStatus(name, value);
      console.log(`📊 ${name}: ${value.toFixed(2)}ms (${status})`);
    }

    // In production, you could send to analytics
    if (import.meta.env.PROD) {
      // Example: Send to analytics service
      // analytics.track('core_web_vital', { metric: name, value, timestamp: Date.now() });
    }
  }

  private getMetricStatus(name: string, value: number): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 600, poor: 1500 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return '✅ Good';
    if (value <= threshold.poor) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Bundle size tracking
  trackBundleSize() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.endsWith('.js'));
      const cssResources = resources.filter(r => r.name.endsWith('.css'));
      
      const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      if (import.meta.env.DEV) {
        console.log(`📦 Bundle Sizes:
        JS: ${(totalJSSize / 1024).toFixed(2)} KB
        CSS: ${(totalCSSSize / 1024).toFixed(2)} KB
        Total: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`);
      }
      
      return { totalJSSize, totalCSSSize, jsResources: jsResources.length };
    }
  }

  // Route performance tracking
  trackRouteChange(routeName: string) {
    const startTime = performance.now();
    
    // Use requestIdleCallback or setTimeout for measuring route change performance
    const callback = () => {
      const endTime = performance.now();
      const routeChangeTime = endTime - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`🔄 Route change to ${routeName}: ${routeChangeTime.toFixed(2)}ms`);
      }
      
      this.reportMetric(`RouteChange_${routeName}`, routeChangeTime);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback);
    } else {
      setTimeout(callback, 0);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();