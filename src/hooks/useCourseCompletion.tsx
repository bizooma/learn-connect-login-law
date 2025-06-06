
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCourseCompletion = (courseId: string) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkCompletion = useCallback(async () => {
    if (!user || !courseId) {
      setIsCompleted(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Checking course completion for:', { courseId, userId: user.id });
      
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        console.error('Error checking course completion:', error);
        setIsCompleted(false);
      } else {
        const completed = data?.status === 'completed';
        console.log('Course completion status:', { completed, status: data?.status });
        setIsCompleted(completed);
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
      setIsCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  return { 
    isCompleted, 
    loading, 
    refetchCompletion: checkCompletion 
  };
};
