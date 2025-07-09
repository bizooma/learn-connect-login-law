import { useEffect, useRef } from 'react';

/**
 * Custom hook for consistent memory cleanup patterns
 * Provides mounted ref and abort controller for preventing memory leaks
 */
export const useMemoryCleanup = () => {
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Setup new abort controller
  const createAbortController = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  // Check if component is still mounted before state updates
  const isMounted = () => mountedRef.current;

  // Safe state setter that checks if component is mounted
  const safeSetState = <T,>(setter: (value: T) => void) => {
    return (value: T) => {
      if (mountedRef.current) {
        setter(value);
      }
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mountedRef,
    abortControllerRef,
    createAbortController,
    isMounted,
    safeSetState
  };
};