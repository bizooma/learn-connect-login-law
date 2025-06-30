
import { useState, useEffect } from "react";
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
      // Try to use the RPC function with type assertion
      const { data, error } = await supabase.rpc('debug_refresh_leaderboards' as any);

      if (error) {
        console.warn('RPC function not found, attempting manual refresh:', error);
        return await manualRefreshCache();
      }
      
      const result = data as any;
      
      toast({
        title: "Success",
        description: `Leaderboards refreshed! Added ${result?.total_cache_entries || 0} entries`,
      });
      
      return result;
    } catch (error: any) {
      console.error('Error refreshing leaderboard cache:', error);
      
      try {
        return await manualRefreshCache();
      } catch (fallbackError: any) {
        toast({
          title: "Error",
          description: `Failed to refresh leaderboards: ${fallbackError.message}`,
          variant: "destructive",
        });
        throw fallbackError;
      }
    }
  };

  const manualRefreshCache = async () => {
    try {
      // Clear existing cache
      await supabase.from('leaderboard_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Manually populate learning streak leaderboard
      const { data: streakData } = await supabase
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

      if (streakData) {
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

        if (cacheEntries.length > 0) {
          await supabase.from('leaderboard_cache').insert(cacheEntries);
        }
      }

      toast({
        title: "Success",
        description: "Leaderboards refreshed manually",
      });

      return { total_cache_entries: streakData?.length || 0 };
    } catch (error: any) {
      console.error('Manual refresh failed:', error);
      throw error;
    }
  };

  const initializeStreaks = async () => {
    try {
      // Try to use the RPC function with type assertion
      const { data, error } = await supabase.rpc('initialize_learning_streaks_from_activity' as any);

      if (error) {
        console.warn('RPC function not found, creating basic streaks:', error);
        return await createBasicStreaks();
      }
      
      toast({
        title: "Success",
        description: `Initialized streaks for ${data || 0} users`,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error initializing streaks:', error);
      
      try {
        return await createBasicStreaks();
      } catch (fallbackError: any) {
        toast({
          title: "Error",
          description: `Failed to initialize streaks: ${fallbackError.message}`,
          variant: "destructive",
        });
        throw fallbackError;
      }
    }
  };

  const createBasicStreaks = async () => {
    try {
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

          await supabase.from('user_learning_streaks').insert(streakRecords);
          
          toast({
            title: "Success",
            description: `Created basic streaks for ${streakRecords.length} users`,
          });

          return streakRecords.length;
        }
      }

      return 0;
    } catch (error: any) {
      console.error('Basic streak creation failed:', error);
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
