import { useCallback, useState } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

export function useQueryCache<T>(cacheTimeout = 5 * 60 * 1000) {
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const getCachedData = useCallback((key: string): T | null => {
    const cached = cache.get(key);
    if (cached && !cached.loading && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    return null;
  }, [cache, cacheTimeout]);

  const setCachedData = useCallback((key: string, data: T) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        loading: false
      });
      return newCache;
    });
  }, []);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const existing = newCache.get(key);
      if (existing) {
        newCache.set(key, { ...existing, loading });
      } else {
        newCache.set(key, {
          data: null as T,
          timestamp: Date.now(),
          loading
        });
      }
      return newCache;
    });
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return cache.get(key)?.loading || false;
  }, [cache]);

  return {
    getCachedData,
    setCachedData,
    setLoading,
    clearCache,
    isLoading
  };
}