import { useCallback, useRef, useEffect } from 'react';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  dependencies: string[];
  accessCount: number;
  lastAccessed: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  memoryUsage: number;
}

class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private dependencyMap = new Map<string, Set<string>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, totalEntries: 0, memoryUsage: 0 };
  private maxSize = 100; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTask();
  }

  // Intelligent cache retrieval with dependency tracking
  get<T>(key: string, dependencies: string[] = []): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      optimizationTracker.trackOptimization(
        'Cache_Miss',
        'memory_optimization',
        0,
        1
      );
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromDependencies(key);
      this.stats.misses++;
      return null;
    }

    // Check if dependencies have been invalidated
    if (this.hasDependencyChanged(key, dependencies)) {
      this.cache.delete(key);
      this.removeFromDependencies(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    optimizationTracker.trackOptimization(
      'Cache_Hit',
      'memory_optimization',
      0,
      1
    );

    return entry.data;
  }

  // Intelligent cache storage with automatic eviction
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000, dependencies: string[] = []): void {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      dependencies,
      accessCount: 1,
      lastAccessed: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    this.updateDependencies(key, dependencies);
    this.updateStats();

    optimizationTracker.trackOptimization(
      'Cache_Set',
      'memory_optimization',
      0,
      this.estimateEntrySize(entry)
    );
  }

  // Dependency-based cache invalidation
  invalidateByDependency(dependency: string): number {
    const dependentKeys = this.dependencyMap.get(dependency);
    if (!dependentKeys) return 0;

    let invalidatedCount = 0;
    dependentKeys.forEach(key => {
      if (this.cache.delete(key)) {
        invalidatedCount++;
        this.removeFromDependencies(key);
      }
    });

    this.dependencyMap.delete(dependency);
    this.updateStats();

    optimizationTracker.trackOptimization(
      'Cache_DependencyInvalidation',
      'memory_optimization',
      0,
      invalidatedCount
    );

    return invalidatedCount;
  }

  // Cache warming for frequently accessed data
  warmCache<T>(
    key: string, 
    dataFetcher: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000, 
    dependencies: string[] = []
  ): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const start = performance.now();
        const data = await dataFetcher();
        const duration = performance.now() - start;

        this.set(key, data, ttl, dependencies);

        optimizationTracker.trackOptimization(
          'Cache_Warm',
          'memory_optimization',
          0,
          duration
        );

        console.log(`🔥 Cache warmed for key: ${key} in ${Math.round(duration)}ms`);
      } catch (error) {
        console.error(`❌ Cache warming failed for key: ${key}`, error);
      }
      resolve();
    });
  }

  // Batch cache warming for related data
  async warmCacheBatch(warmingTasks: Array<{
    key: string;
    fetcher: () => Promise<any>;
    ttl?: number;
    dependencies?: string[];
  }>): Promise<void> {
    const start = performance.now();
    
    const promises = warmingTasks.map(task => 
      this.warmCache(task.key, task.fetcher, task.ttl, task.dependencies)
    );

    await Promise.allSettled(promises);
    
    const duration = performance.now() - start;
    optimizationTracker.trackOptimization(
      'Cache_BatchWarm',
      'parallel_processing',
      0,
      duration,
      warmingTasks.length
    );

    console.log(`🔥 Batch cache warming completed: ${warmingTasks.length} items in ${Math.round(duration)}ms`);
  }

  // Smart cache preloading based on usage patterns
  preloadRelatedData<T>(
    baseKey: string, 
    relatedKeys: string[], 
    dataFetcher: (key: string) => Promise<T>
  ): void {
    // Only preload if base key is frequently accessed
    const baseEntry = this.cache.get(baseKey);
    if (baseEntry && baseEntry.accessCount > 3) {
      relatedKeys.forEach(relatedKey => {
        if (!this.cache.has(relatedKey)) {
          setTimeout(() => {
            this.warmCache(relatedKey, () => dataFetcher(relatedKey), 3 * 60 * 1000, [baseKey]);
          }, 100); // Small delay to avoid blocking
        }
      });
    }
  }

  // Memory-efficient cleanup
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.removeFromDependencies(oldestKey);
      this.stats.evictions++;
    }
  }

  private hasDependencyChanged(key: string, newDependencies: string[]): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Simple dependency change detection - in real app, this would be more sophisticated
    return JSON.stringify(entry.dependencies.sort()) !== JSON.stringify(newDependencies.sort());
  }

  private updateDependencies(key: string, dependencies: string[]): void {
    dependencies.forEach(dep => {
      if (!this.dependencyMap.has(dep)) {
        this.dependencyMap.set(dep, new Set());
      }
      this.dependencyMap.get(dep)!.add(key);
    });
  }

  private removeFromDependencies(key: string): void {
    this.dependencyMap.forEach((keys, dependency) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.dependencyMap.delete(dependency);
      }
    });
  }

  private estimateEntrySize(entry: CacheEntry): number {
    // Rough estimation of memory usage
    return JSON.stringify(entry.data).length + entry.dependencies.join('').length + 100;
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + this.estimateEntrySize(entry), 0);
  }

  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          this.removeFromDependencies(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        this.updateStats();
        optimizationTracker.trackOptimization(
          'Cache_AutoCleanup',
          'memory_optimization',
          0,
          cleanedCount
        );
      }
    }, 60000); // Run every minute
  }

  // Public API
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    };
  }

  clear(): void {
    this.cache.clear();
    this.dependencyMap.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalEntries: 0, memoryUsage: 0 };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache manager instance
const globalCacheManager = new AdvancedCacheManager();

export const useAdvancedCaching = () => {
  const cacheManagerRef = useRef(globalCacheManager);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy global cache on component unmount
      // cacheManagerRef.current.destroy();
    };
  }, []);

  const getCachedData = useCallback(<T,>(
    key: string, 
    dependencies: string[] = []
  ): T | null => {
    return cacheManagerRef.current.get<T>(key, dependencies);
  }, []);

  const setCachedData = useCallback(<T,>(
    key: string, 
    data: T, 
    ttl: number = 5 * 60 * 1000, 
    dependencies: string[] = []
  ): void => {
    cacheManagerRef.current.set(key, data, ttl, dependencies);
  }, []);

  const invalidateCache = useCallback((dependency: string): number => {
    return cacheManagerRef.current.invalidateByDependency(dependency);
  }, []);

  const warmCache = useCallback(<T,>(
    key: string,
    dataFetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000,
    dependencies: string[] = []
  ): Promise<void> => {
    return cacheManagerRef.current.warmCache(key, dataFetcher, ttl, dependencies);
  }, []);

  const batchWarmCache = useCallback((warmingTasks: Array<{
    key: string;
    fetcher: () => Promise<any>;
    ttl?: number;
    dependencies?: string[];
  }>): Promise<void> => {
    return cacheManagerRef.current.warmCacheBatch(warmingTasks);
  }, []);

  const preloadRelatedData = useCallback(<T,>(
    baseKey: string,
    relatedKeys: string[],
    dataFetcher: (key: string) => Promise<T>
  ): void => {
    cacheManagerRef.current.preloadRelatedData(baseKey, relatedKeys, dataFetcher);
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheManagerRef.current.getStats();
  }, []);

  const clearCache = useCallback(() => {
    cacheManagerRef.current.clear();
  }, []);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    warmCache,
    batchWarmCache,
    preloadRelatedData,
    getCacheStats,
    clearCache
  };
};

export default useAdvancedCaching;