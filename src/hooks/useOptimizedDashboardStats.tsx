import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

export interface DashboardStats {
  total_users: number;
  total_courses: number;
  total_assignments: number;
  completed_courses: number;
  in_progress_courses: number;
  average_progress: number;
  active_learners: number;
}

// Cache for dashboard stats
const statsCache = new Map<string, { data: DashboardStats; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes for dashboard stats

export const useOptimizedDashboardStats = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    const start = performance.now();
    
    // Check cache first
    const cached = statsCache.get('global');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setStats(cached.data);
      optimizationTracker.trackOptimization(
        'DashboardStats_CacheHit',
        'memory_optimization',
        0,
        performance.now() - start
      );
      return cached.data;
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

      // Cache the results
      statsCache.set('global', {
        data: statsData,
        timestamp: Date.now()
      });

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
  }, []);

  // Refresh cache (materialized view refresh will be available after migration)
  const refreshStatsCache = useCallback(async () => {
    console.log('Refreshing dashboard stats cache manually');
    // Clear cache and fetch fresh data
    statsCache.clear();
    return await fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Clear cache when needed
  const clearCache = useCallback(() => {
    statsCache.clear();
  }, []);

  // Memoized cache status
  const cacheStats = useMemo(() => ({
    size: statsCache.size,
    entries: Array.from(statsCache.keys()),
    lastUpdate: statsCache.get('global')?.timestamp
  }), [stats]);

  return {
    stats,
    loading,
    fetchDashboardStats,
    refreshStatsCache,
    clearCache,
    cacheStats
  };
};