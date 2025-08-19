import { useState, useEffect, useRef } from 'react';

interface UseVideoLazyLoadingProps {
  videoId: string;
  threshold?: number;
  rootMargin?: string;
}

// PHASE 4: Progressive loading strategy to prevent multiple simultaneous video loads
export const useVideoLazyLoading = ({
  videoId,
  threshold = 0.1,
  rootMargin = '50px'
}: UseVideoLazyLoadingProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !videoId) return;

    // PHASE 4: Use Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // PHASE 4: Delay video loading slightly to prevent browser freeze
          setTimeout(() => {
            setShouldLoad(true);
          }, 500);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videoId, threshold, rootMargin]);

  // PHASE 4: Reset loading state when video changes
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