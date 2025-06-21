
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
      const { error } = await supabase.rpc('refresh_leaderboard_cache');
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Leaderboards refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing leaderboard cache:', error);
      toast({
        title: "Error",
        description: "Failed to refresh leaderboards",
        variant: "destructive",
      });
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
  };
};
