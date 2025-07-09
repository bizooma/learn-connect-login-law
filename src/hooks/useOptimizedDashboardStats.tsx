import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';
import { useAdvancedCaching } from './useAdvancedCaching';

export interface DashboardStats {
  total_users: number;
  total_courses: number;
  total_assignments: number;
  completed_courses: number;
  in_progress_courses: number;
  average_progress: number;
  active_learners: number;
}

export const useOptimizedDashboardStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { getCachedData, setCachedData, invalidateCache, warmCache, getCacheStats } = useAdvancedCaching();

  const fetchDashboardStats = useCallback(async () => {
    const start = performance.now();
    const cacheKey = 'dashboard_stats_global';
    const dependencies = ['users', 'courses', 'assignments', 'progress', 'streaks'];
    
    // Check advanced cache first
    const cached = getCachedData<DashboardStats>(cacheKey, dependencies);
    if (cached) {
      setStats(cached);
      optimizationTracker.trackOptimization(
        'DashboardStats_AdvancedCacheHit',
        'memory_optimization',
        0,
        performance.now() - start
      );
      return cached;
    }

    setLoading(true);

    try {
      console.log('📊 Fetching optimized dashboard stats');

      // Use optimized batch queries (materialized view will be available after migration)
      console.log('Using optimized parallel queries for dashboard stats');
      
      const [usersResult, coursesResult, assignmentsResult, progressResult, streaksResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_deleted', false),
        
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true }),
        
        supabase
          .from('course_assignments')
          .select('id', { count: 'exact', head: true }),
        
        supabase
          .from('user_course_progress')
          .select('status, progress_percentage'),
        
        supabase
          .from('user_learning_streaks')
          .select('user_id', { count: 'exact', head: true })
          .gte('current_streak', 1)
      ]);

      const progressData = progressResult.data || [];
      const completedCount = progressData.filter(p => p.status === 'completed').length;
      const inProgressCount = progressData.filter(p => p.status === 'in_progress').length;
      const avgProgress = progressData.length > 0 
        ? progressData.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / progressData.length
        : 0;

      const statsData: DashboardStats = {
        total_users: usersResult.count || 0,
        total_courses: coursesResult.count || 0,
        total_assignments: assignmentsResult.count || 0,
        completed_courses: completedCount,
        in_progress_courses: inProgressCount,
        average_progress: Math.round(avgProgress * 100) / 100,
        active_learners: streaksResult.count || 0
      };

      // Cache the results with advanced caching
      setCachedData(cacheKey, statsData, 2 * 60 * 1000, dependencies);

      setStats(statsData);
      
      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'DashboardStats_OptimizedFetch',
        'database_batch',
        0,
        duration
      );
      
      console.log('✅ Optimized dashboard stats loaded in', Math.round(duration), 'ms');
      return statsData;

    } catch (error: any) {
      console.error('❌ Error fetching dashboard stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData]);

  // Refresh cache using advanced caching
  const refreshStatsCache = useCallback(async () => {
    console.log('Refreshing dashboard stats cache manually');
    // Clear cache and fetch fresh data
    invalidateCache('users');
    invalidateCache('courses');
    invalidateCache('assignments');
    invalidateCache('progress');
    invalidateCache('streaks');
    return await fetchDashboardStats();
  }, [fetchDashboardStats, invalidateCache]);

  // Clear cache when needed
  const clearCacheAdvanced = useCallback(() => {
    invalidateCache('users');
    invalidateCache('courses');
    invalidateCache('assignments');
    invalidateCache('progress');
    invalidateCache('streaks');
  }, [invalidateCache]);

  // Memoized cache status using advanced caching
  const advancedCacheStats = useMemo(() => getCacheStats(), [getCacheStats, stats]);

  return {
    stats,
    loading,
    fetchDashboardStats,
    refreshStatsCache,
    clearCache: clearCacheAdvanced,
    cacheStats: advancedCacheStats
  };
};