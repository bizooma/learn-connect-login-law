
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useLeaderboards = () => {
  const [userStreak, setUserStreak] = useState<StreakData | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserStreak = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_learning_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserStreak(data);
    } catch (error) {
      console.error('Error fetching user streak:', error);
    }
  };

  const fetchUserAchievements = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  };

  const getUserRank = async (userId: string, leaderboardType: string) => {
    try {
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

      return data?.rank_position || null;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  };

  const refreshCache = async () => {
    try {
      console.log('Starting optimized leaderboard cache refresh...');
      
      // Clear existing cache first
      const { error: deleteError } = await supabase
        .from('leaderboard_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.warn('Warning clearing cache:', deleteError);
      }

      // Use optimized SQL functions for all leaderboards in parallel
      const [streakResult, salesResult, legalResult] = await Promise.allSettled([
        refreshStreakLeaderboard(),
        refreshCategoryLeaderboard('Sales', 'sales_training'),
        refreshCategoryLeaderboard('Legal', 'legal_training')
      ]);

      // Check results and log any errors
      let totalEntries = 0;
      const errors: string[] = [];

      if (streakResult.status === 'fulfilled') {
        totalEntries += streakResult.value;
      } else {
        errors.push(`Streak leaderboard: ${streakResult.reason}`);
      }

      if (salesResult.status === 'fulfilled') {
        totalEntries += salesResult.value;
      } else {
        errors.push(`Sales leaderboard: ${salesResult.reason}`);
      }

      if (legalResult.status === 'fulfilled') {
        totalEntries += legalResult.value;
      } else {
        errors.push(`Legal leaderboard: ${legalResult.reason}`);
      }

      if (errors.length > 0) {
        console.warn('Some leaderboards failed to refresh:', errors);
      }

      const finalCount = await getTotalCacheEntries();
      
      toast({
        title: "Success",
        description: `Leaderboards refreshed! Total entries: ${finalCount}`,
      });
      
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
  };

  const refreshStreakLeaderboard = async (): Promise<number> => {
    try {
      console.log('Refreshing streak leaderboard with optimized SQL function...');
      
      // Use optimized SQL function instead of JavaScript processing
      const { data: streakData, error: streakError } = await supabase
        .rpc('generate_learning_streak_leaderboard', { p_limit: 50 });

      if (streakError) {
        console.error('Error calling streak leaderboard function:', streakError);
        throw streakError;
      }

      if (!streakData || streakData.length === 0) {
        console.log('No streak data available');
        return 0;
      }

      // Prepare cache entries from optimized SQL results
      const cacheEntries = streakData.map((entry: any) => ({
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
      }));

      // Batch insert with transaction support
      const { error: insertError } = await supabase
        .from('leaderboard_cache')
        .insert(cacheEntries);

      if (insertError) {
        console.error('Error inserting streak cache:', insertError);
        throw insertError;
      }

      console.log(`Successfully cached ${cacheEntries.length} streak entries`);
      return cacheEntries.length;
    } catch (error) {
      console.error('Error refreshing streak leaderboard:', error);
      throw error;
    }
  };

  const refreshCategoryLeaderboard = async (category: string, leaderboardType: string): Promise<number> => {
    try {
      console.log(`Refreshing ${category} leaderboard with optimized SQL function...`);
      
      // Use optimized SQL function instead of JavaScript processing
      const { data: categoryData, error: categoryError } = await supabase
        .rpc('generate_category_leaderboard', { 
          p_category: category,
          p_limit: 50 
        });

      if (categoryError) {
        console.error(`Error calling ${category} leaderboard function:`, categoryError);
        throw categoryError;
      }

      if (!categoryData || categoryData.length === 0) {
        console.log(`No ${category} data available`);
        return 0;
      }

      // Prepare cache entries from optimized SQL results
      const cacheEntries = categoryData.map((entry: any) => ({
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
      }));

      // Batch insert with transaction support
      const { error: insertError } = await supabase
        .from('leaderboard_cache')
        .insert(cacheEntries);

      if (insertError) {
        console.error(`Error inserting ${category} cache:`, insertError);
        throw insertError;
      }

      console.log(`Successfully cached ${cacheEntries.length} ${category} entries`);
      return cacheEntries.length;
    } catch (error) {
      console.error(`Error refreshing ${category} leaderboard:`, error);
      throw error;
    }
  };

  const getTotalCacheEntries = async () => {
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
  };

  const initializeStreaks = async () => {
    try {
      console.log('Initializing learning streaks...');
      
      // Get users who have completed units but don't have streak records
      const { data: usersWithProgress } = await supabase
        .from('user_unit_progress')
        .select('user_id')
        .eq('completed', true);

      if (usersWithProgress && usersWithProgress.length > 0) {
        // Get unique user IDs and check which ones don't have streaks
        const uniqueUserIds = [...new Set(usersWithProgress.map(u => u.user_id))];
        
        const { data: existingStreaks } = await supabase
          .from('user_learning_streaks')
          .select('user_id')
          .in('user_id', uniqueUserIds);

        const existingUserIds = new Set(existingStreaks?.map(s => s.user_id) || []);
        const newUserIds = uniqueUserIds.filter(id => !existingUserIds.has(id));

        if (newUserIds.length > 0) {
          const streakRecords = newUserIds
            .slice(0, 50)
            .map((userId) => ({
              user_id: userId,
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: new Date().toISOString().split('T')[0],
              streak_start_date: new Date().toISOString().split('T')[0],
              is_active: true
            }));

          const { error } = await supabase.from('user_learning_streaks').insert(streakRecords);
          
          if (error) {
            console.error('Error creating streaks:', error);
            throw error;
          }
          
          toast({
            title: "Success",
            description: `Created basic streaks for ${streakRecords.length} users`,
          });

          return streakRecords.length;
        }
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
  };

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
