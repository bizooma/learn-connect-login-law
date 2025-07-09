import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { optimizationTracker } from "@/utils/algorithmicOptimizationTracker";

export interface StreakData {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface UserAchievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  earned_at: string;
}

interface CacheEntry {
  leaderboard_type: string;
  user_id: string;
  user_name: string;
  user_email: string;
  score: number;
  rank_position: number;
  additional_data: any;
}

// Optimized leaderboard hook with performance improvements
export const useOptimizedLeaderboards = () => {
  const [userStreak, setUserStreak] = useState<StreakData | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Cache for expensive operations
  const cacheRef = useRef(new Map<string, any>());
  const lastRefreshRef = useRef(0);

  // Memoized cache operations
  const getCachedData = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    cacheRef.current.set(key, data);
  }, []);

  // Optimized user streak fetching with caching
  const fetchUserStreak = useCallback(async (userId: string) => {
    const cacheKey = `user_streak_${userId}`;
    const cached = getCachedData(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 30000) { // 30s cache
      setUserStreak(cached.data);
      return;
    }

    try {
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('user_learning_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'fetchUserStreak',
        'database_batch',
        0,
        duration
      );

      setUserStreak(data);
      setCachedData(cacheKey, { data, timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching user streak:', error);
    }
  }, [getCachedData, setCachedData]);

  // Optimized achievements fetching with batch processing
  const fetchUserAchievements = useCallback(async (userId: string) => {
    const cacheKey = `user_achievements_${userId}`;
    const cached = getCachedData(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 60000) { // 1min cache
      setUserAchievements(cached.data);
      return;
    }

    try {
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        throw error;
      }

      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'fetchUserAchievements',
        'database_batch',
        0,
        duration,
        data?.length || 0
      );

      setUserAchievements(data || []);
      setCachedData(cacheKey, { data: data || [], timestamp: Date.now() });
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [getCachedData, setCachedData]);

  // Optimized rank fetching with intelligent caching
  const getUserRank = useCallback(async (userId: string, leaderboardType: string) => {
    const cacheKey = `user_rank_${userId}_${leaderboardType}`;
    const cached = getCachedData(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 120000) { // 2min cache
      return cached.data;
    }

    try {
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('rank_position')
        .eq('leaderboard_type', leaderboardType)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'getUserRank',
        'database_batch',
        0,
        duration
      );

      const rank = data?.rank_position || null;
      setCachedData(cacheKey, { data: rank, timestamp: Date.now() });
      return rank;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }, [getCachedData, setCachedData]);

  // Optimized cache refresh with batch operations and parallel processing
  const refreshCache = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) { // 5s cooldown
      return { total_cache_entries: await getTotalCacheEntries() };
    }
    lastRefreshRef.current = now;

    try {
      console.log('Starting optimized leaderboard cache refresh...');
      const overallStart = performance.now();
      
      // Clear existing cache first - optimized with single query
      const { error: deleteError } = await supabase
        .from('leaderboard_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.warn('Warning clearing cache:', deleteError);
      }

      // Parallel execution of all leaderboard refreshes
      const refreshOperations = [
        refreshStreakLeaderboard(),
        refreshCategoryLeaderboard('Sales', 'sales_training'),
        refreshCategoryLeaderboard('Legal', 'legal_training')
      ];

      const results = await Promise.allSettled(refreshOperations);
      
      // Process results with optimized error handling
      let totalEntries = 0;
      const errors: string[] = [];

      results.forEach((result, index) => {
        const types = ['Streak', 'Sales', 'Legal'];
        if (result.status === 'fulfilled') {
          totalEntries += result.value;
        } else {
          errors.push(`${types[index]} leaderboard: ${result.reason}`);
        }
      });

      if (errors.length > 0) {
        console.warn('Some leaderboards failed to refresh:', errors);
      }

      const finalCount = await getTotalCacheEntries();
      const totalDuration = performance.now() - overallStart;
      
      // Track overall optimization
      optimizationTracker.trackOptimization(
        'refreshCache_Complete',
        'parallel_processing',
        0,
        totalDuration,
        finalCount
      );
      
      toast({
        title: "Success",
        description: `Leaderboards refreshed! Total entries: ${finalCount}`,
      });
      
      // Clear all caches after refresh
      cacheRef.current.clear();
      
      return { total_cache_entries: finalCount };
    } catch (error: any) {
      console.error('Error refreshing leaderboard cache:', error);
      toast({
        title: "Error",
        description: `Failed to refresh leaderboards: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Optimized streak leaderboard refresh with batch operations
  const refreshStreakLeaderboard = useCallback(async (): Promise<number> => {
    try {
      const start = performance.now();
      
      const { data: streakData, error: streakError } = await supabase
        .rpc('generate_learning_streak_leaderboard', { p_limit: 50 });

      if (streakError) {
        throw streakError;
      }

      if (!streakData || streakData.length === 0) {
        return 0;
      }

      // Optimized batch insertion with pre-allocated array
      const cacheEntries: any[] = new Array(streakData.length);
      for (let i = 0; i < streakData.length; i++) {
        const entry = streakData[i];
        cacheEntries[i] = {
          leaderboard_type: 'learning_streak',
          user_id: entry.user_id,
          user_name: entry.user_name,
          user_email: entry.user_email,
          score: entry.current_streak,
          rank_position: entry.rank_position,
          additional_data: {
            current_streak: entry.current_streak,
            longest_streak: entry.longest_streak
          }
        };
      }

      const { error: insertError } = await supabase
        .from('leaderboard_cache')
        .insert(cacheEntries);

      if (insertError) {
        throw insertError;
      }

      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        'refreshStreakLeaderboard',
        'database_batch',
        0,
        duration,
        cacheEntries.length
      );

      return cacheEntries.length;
    } catch (error) {
      console.error('Error refreshing streak leaderboard:', error);
      throw error;
    }
  }, []);

  // Optimized category leaderboard refresh
  const refreshCategoryLeaderboard = useCallback(async (category: string, leaderboardType: string): Promise<number> => {
    try {
      const start = performance.now();
      
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('generate_category_leaderboard', { 
          p_category: category,
          p_limit: 50 
        });

      if (categoryError) {
        throw categoryError;
      }

      if (!categoryData || categoryData.length === 0) {
        return 0;
      }

      // Optimized batch processing with pre-allocated array
      const cacheEntries: any[] = new Array(categoryData.length);
      for (let i = 0; i < categoryData.length; i++) {
        const entry = categoryData[i];
        cacheEntries[i] = {
          leaderboard_type: leaderboardType,
          user_id: entry.user_id,
          user_name: entry.user_name,
          user_email: entry.user_email,
          score: entry.completion_rate,
          rank_position: entry.rank_position,
          additional_data: {
            courses_completed: entry.courses_completed,
            total_courses: entry.total_courses,
            completion_rate: entry.completion_rate
          }
        };
      }

      const { error: insertError } = await supabase
        .from('leaderboard_cache')
        .insert(cacheEntries);

      if (insertError) {
        throw insertError;
      }

      const duration = performance.now() - start;
      optimizationTracker.trackOptimization(
        `refreshCategoryLeaderboard_${category}`,
        'database_batch',
        0,
        duration,
        cacheEntries.length
      );

      return cacheEntries.length;
    } catch (error) {
      console.error(`Error refreshing ${category} leaderboard:`, error);
      throw error;
    }
  }, []);

  // Memoized cache count function
  const getTotalCacheEntries = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('leaderboard_cache')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());

      return count || 0;
    } catch (error) {
      console.error('Error getting cache count:', error);
      return 0;
    }
  }, []);

  // Optimized streak initialization with batch operations
  const initializeStreaks = useCallback(async () => {
    try {
      const start = performance.now();
      
      // Optimized query with better filtering
      const { data: usersWithProgress } = await supabase
        .from('user_unit_progress')
        .select('user_id')
        .eq('completed', true)
        .limit(1000); // Reasonable limit

      if (!usersWithProgress || usersWithProgress.length === 0) {
        return 0;
      }

      // Use Set for O(1) lookups instead of array operations
      const uniqueUserIds = Array.from(new Set(usersWithProgress.map(u => u.user_id)));
      
      const { data: existingStreaks } = await supabase
        .from('user_learning_streaks')
        .select('user_id')
        .in('user_id', uniqueUserIds);

      const existingUserIds = new Set(existingStreaks?.map(s => s.user_id) || []);
      const newUserIds = uniqueUserIds.filter(id => !existingUserIds.has(id));

      if (newUserIds.length > 0) {
        const batchSize = 50;
        const today = new Date().toISOString().split('T')[0];
        
        // Process in batches for memory efficiency
        const streakRecords = newUserIds
          .slice(0, batchSize)
          .map((userId) => ({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            streak_start_date: today,
            is_active: true
          }));

        const { error } = await supabase
          .from('user_learning_streaks')
          .insert(streakRecords);
        
        if (error) {
          throw error;
        }

        const duration = performance.now() - start;
        optimizationTracker.trackOptimization(
          'initializeStreaks',
          'database_batch',
          0,
          duration,
          streakRecords.length
        );
        
        toast({
          title: "Success",
          description: `Created basic streaks for ${streakRecords.length} users`,
        });

        return streakRecords.length;
      }

      return 0;
    } catch (error: any) {
      console.error('Error initializing streaks:', error);
      toast({
        title: "Error",
        description: `Failed to initialize streaks: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Cleanup effect for memory management
  useEffect(() => {
    return () => {
      cacheRef.current.clear();
    };
  }, []);

  return {
    userStreak,
    userAchievements,
    loading,
    fetchUserStreak,
    fetchUserAchievements,
    getUserRank,
    refreshCache,
    initializeStreaks,
  };
};