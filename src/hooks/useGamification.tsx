
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type UserPoints = Tables<'user_points'>;
type Achievement = Tables<'achievements'>;
type UserAchievement = Tables<'user_achievements'>;
type LearningStreak = Tables<'learning_streaks'>;
type PointTransaction = Tables<'point_transactions'>;

interface UserAchievementWithDetails extends UserAchievement {
  achievements: Achievement;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievementWithDetails[]>([]);
  const [learningStreak, setLearningStreak] = useState<LearningStreak | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchGamificationData();
    }
  }, [user?.id]);

  const fetchGamificationData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserPoints(pointsData);

      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      setAchievements(achievementsData || []);

      // Fetch user's earned achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user.id);
      
      setUserAchievements(userAchievementsData || []);

      // Fetch learning streak
      const { data: streakData } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setLearningStreak(streakData);

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setRecentTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = async (points: number, activityType: string, activityId?: string, description?: string) => {
    if (!user?.id) return;

    try {
      // Call the database function to update points
      const { error } = await supabase.rpc('update_user_points', {
        p_user_id: user.id,
        p_points: points,
        p_activity_type: activityType,
        p_activity_id: activityId || null,
        p_description: description || `Earned ${points} points for ${activityType}`
      });

      if (error) throw error;

      // Check for new achievements
      await supabase.rpc('check_achievements', {
        p_user_id: user.id
      });

      // Refresh data
      await fetchGamificationData();
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak data
      const { data: currentStreak } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentStreak) {
        // Create new streak
        await supabase
          .from('learning_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            streak_start_date: today
          });
      } else {
        const lastActivity = currentStreak.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = currentStreak.current_streak;
        let startDate = currentStreak.streak_start_date;

        if (lastActivity === today) {
          // Already logged today, no change
          return;
        } else if (lastActivity === yesterdayStr) {
          // Consecutive day, increment streak
          newStreak += 1;
        } else {
          // Streak broken, reset
          newStreak = 1;
          startDate = today;
        }

        const longestStreak = Math.max(currentStreak.longest_streak, newStreak);

        await supabase
          .from('learning_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_activity_date: today,
            streak_start_date: startDate
          })
          .eq('user_id', user.id);

        // Award streak points
        await awardPoints(5 + Math.floor(newStreak / 7) * 5, 'daily_streak', undefined, `Daily learning streak: ${newStreak} days`);
      }

      await fetchGamificationData();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  return {
    userPoints,
    achievements,
    userAchievements,
    learningStreak,
    recentTransactions,
    loading,
    awardPoints,
    updateStreak,
    refreshData: fetchGamificationData
  };
};
