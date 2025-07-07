
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

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
      logger.error('Error fetching user streak:', error);
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
      logger.error('Error fetching user achievements:', error);
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
      logger.error('Error fetching user rank:', error);
      return null;
    }
  };

  const refreshCache = async () => {
    try {
      logger.log('Starting leaderboard cache refresh...');
      
      // Clear existing cache first
      const { error: deleteError } = await supabase
        .from('leaderboard_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        logger.warn('Warning clearing cache:', deleteError);
      }

      // Refresh learning streak leaderboard
      const { data: streakData, error: streakError } = await supabase
        .from('user_learning_streaks')
        .select(`
          user_id,
          current_streak,
          longest_streak,
          profiles!inner(first_name, last_name, email, is_deleted)
        `)
        .eq('profiles.is_deleted', false)
        .gte('current_streak', 1)
        .order('current_streak', { ascending: false })
        .limit(50);

      if (streakError) {
        logger.error('Error fetching streak data:', streakError);
      } else if (streakData && streakData.length > 0) {
        const cacheEntries = streakData.map((entry: any, index: number) => ({
          leaderboard_type: 'learning_streak',
          user_id: entry.user_id,
          user_name: `${entry.profiles.first_name} ${entry.profiles.last_name}`,
          user_email: entry.profiles.email,
          score: entry.current_streak,
          rank_position: index + 1,
          additional_data: {
            current_streak: entry.current_streak,
            longest_streak: entry.longest_streak
          }
        }));

        const { error: insertError } = await supabase
          .from('leaderboard_cache')
          .insert(cacheEntries);

        if (insertError) {
          logger.error('Error inserting streak cache:', insertError);
        } else {
          logger.log(`Successfully cached ${cacheEntries.length} streak entries`);
        }
      }

      // Refresh category leaderboards for Sales
      await refreshCategoryLeaderboard('Sales', 'sales_training');
      
      // Refresh category leaderboards for Legal
      await refreshCategoryLeaderboard('Legal', 'legal_training');

      const finalCount = await getTotalCacheEntries();
      
      toast({
        title: "Success",
        description: `Leaderboards refreshed! Total entries: ${finalCount}`,
      });
      
      return { total_cache_entries: finalCount };
    } catch (error: any) {
      logger.error('Error refreshing leaderboard cache:', error);
      toast({
        title: "Error",
        description: `Failed to refresh leaderboards: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshCategoryLeaderboard = async (category: string, leaderboardType: string) => {
    try {
      // Get users with course assignments in this category
      const { data: categoryData, error: categoryError } = await supabase
        .from('course_assignments')
        .select(`
          user_id,
          course_id,
          courses!inner(category),
          profiles!inner(first_name, last_name, email, is_deleted),
          user_course_progress(status)
        `)
        .eq('courses.category', category)
        .eq('profiles.is_deleted', false);

      if (categoryError || !categoryData) {
        logger.warn(`No data found for ${category} category:`, categoryError);
        return;
      }

      // Group by user and calculate completion rates
      const userStats = new Map();
      
      categoryData.forEach((item: any) => {
        const userId = item.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            user_name: `${item.profiles.first_name} ${item.profiles.last_name}`,
            user_email: item.profiles.email,
            total_courses: 0,
            completed_courses: 0
          });
        }
        
        const stats = userStats.get(userId);
        stats.total_courses++;
        
        if (item.user_course_progress && item.user_course_progress.length > 0) {
          const progress = item.user_course_progress[0];
          if (progress.status === 'completed') {
            stats.completed_courses++;
          }
        }
      });

      // Convert to array and calculate completion rates
      const rankedUsers = Array.from(userStats.values())
        .map((stats: any) => ({
          ...stats,
          completion_rate: stats.total_courses > 0 
            ? Math.round((stats.completed_courses / stats.total_courses) * 100) 
            : 0
        }))
        .sort((a, b) => {
          if (b.completion_rate !== a.completion_rate) {
            return b.completion_rate - a.completion_rate;
          }
          return b.completed_courses - a.completed_courses;
        })
        .slice(0, 50);

      if (rankedUsers.length > 0) {
        const cacheEntries = rankedUsers.map((user: any, index: number) => ({
          leaderboard_type: leaderboardType,
          user_id: user.user_id,
          user_name: user.user_name,
          user_email: user.user_email,
          score: user.completion_rate,
          rank_position: index + 1,
          additional_data: {
            courses_completed: user.completed_courses,
            total_courses: user.total_courses,
            completion_rate: user.completion_rate
          }
        }));

        const { error: insertError } = await supabase
          .from('leaderboard_cache')
          .insert(cacheEntries);

        if (insertError) {
          logger.error(`Error inserting ${category} cache:`, insertError);
        } else {
          logger.log(`Successfully cached ${cacheEntries.length} ${category} entries`);
        }
      }
    } catch (error) {
      logger.error(`Error refreshing ${category} leaderboard:`, error);
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
      logger.error('Error getting cache count:', error);
      return 0;
    }
  };

  const initializeStreaks = async () => {
    try {
      logger.log('Initializing learning streaks...');
      
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
            logger.error('Error creating streaks:', error);
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
      logger.error('Error initializing streaks:', error);
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
