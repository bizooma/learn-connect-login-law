
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
      // Simple course completion without gamification
      console.log(`Course ${courseId} completed by user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error marking course as completed:', error);
      return false;
    }
  };

  return { isCompleted, loading, markCourseCompleted };
};
