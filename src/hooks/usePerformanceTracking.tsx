import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor } from '@/utils/performanceMonitor';

export const usePerformanceTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track route changes
    const routeName = location.pathname.replace('/', '') || 'home';
    performanceMonitor.trackRouteChange(routeName);
  }, [location.pathname]);

  useEffect(() => {
    // Track bundle sizes on mount
    const timer = setTimeout(() => {
      performanceMonitor.trackBundleSize();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Provide performance utilities
  const getMetrics = () => performanceMonitor.getMetrics();
  
  return { getMetrics };
};