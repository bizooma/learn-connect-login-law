import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCourseCompletion = (userId: string) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCompletion = async () => {
      if (!user || !userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_course_progress')
          .select('status')
          .eq('user_id', user.id)
          .eq('course_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error checking course completion:', error);
          setIsCompleted(false);
        } else {
          setIsCompleted(data?.status === 'completed');
        }
      } catch (error) {
        console.error('Error checking course completion:', error);
        setIsCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    checkCompletion();
  }, [user, userId]);

  const markCourseCompleted = async (courseId: string) => {
    if (!userId) return false;

    try {
      const { hasGamificationAccess } = await import("@/utils/gamificationAccess");
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Get user profile to check email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      // Check if user has gamification access
      if (profile && hasGamificationAccess(profile.email)) {
        try {
          // Get course details for points calculation
          const { data: course } = await supabase
            .from('courses')
            .select('title, level')
            .eq('id', courseId)
            .single();
          
          // Calculate points based on course level
          let points = 100; // Base course completion points
          if (course?.level === 'Advanced') points = 200;
          else if (course?.level === 'Intermediate') points = 150;
          
          // Award points
          await supabase.rpc('update_user_points', {
            p_user_id: userId,
            p_points: points,
            p_activity_type: 'course_completion',
            p_activity_id: courseId,
            p_description: `Completed course: ${course?.title || 'Unknown Course'}`
          });
          
          // Update learning streak
          await updateLearningStreak(userId);
          
          // Check for new achievements
          await supabase.rpc('check_achievements', {
            p_user_id: userId
          });
          
          console.log(`Awarded ${points} XP for course completion`);
        } catch (error) {
          console.error('Error awarding course completion points:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error marking course as completed:', error);
      return false;
    }
  };

  const updateLearningStreak = async (userId: string) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak data
      const { data: currentStreak } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!currentStreak) {
        // Create new streak
        await supabase
          .from('learning_streaks')
          .insert({
            user_id: userId,
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
          .eq('user_id', userId);

        // Award streak points
        await supabase.rpc('update_user_points', {
          p_user_id: userId,
          p_points: 5 + Math.floor(newStreak / 7) * 5,
          p_activity_type: 'daily_streak',
          p_activity_id: null,
          p_description: `Daily learning streak: ${newStreak} days`
        });
      }
    } catch (error) {
      console.error('Error updating learning streak:', error);
    }
  };

  return { isCompleted, loading, markCourseCompleted, updateLearningStreak };
};
