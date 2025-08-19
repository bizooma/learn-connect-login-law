import { useState, useEffect, useRef } from 'react';

interface UseVideoLazyLoadingProps {
  videoId: string;
  threshold?: number;
  rootMargin?: string;
}

// Simplified loading strategy with immediate fallback
export const useVideoLazyLoading = ({
  videoId,
  threshold = 0.1,
  rootMargin = '100px'
}: UseVideoLazyLoadingProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !videoId) return;

    // Immediate fallback - load video after 2 seconds regardless of visibility
    timeoutRef.current = setTimeout(() => {
      setShouldLoad(true);
    }, 2000);

    // Try intersection observer for optimization
    try {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsVisible(true);
            setShouldLoad(true); // Load immediately when visible
            
            // Clear the fallback timeout since we're loading now
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        },
        {
          threshold,
          rootMargin
        }
      );

      observerRef.current.observe(element);
    } catch (error) {
      // If intersection observer fails, load immediately
      console.warn('Intersection Observer failed, loading video immediately:', error);
      setShouldLoad(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [videoId, threshold, rootMargin]);

  // Reset loading state when video changes
  useEffect(() => {
    setShouldLoad(false);
    setIsVisible(false);
  }, [videoId]);

  return {
    elementRef,
    isVisible,
    shouldLoad
  };
};