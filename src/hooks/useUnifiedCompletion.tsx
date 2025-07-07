import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface CompletionResult {
  success: boolean;
  progress_percentage?: number;
  status?: string;
  message?: string;
}

/**
 * Unified completion hook that works alongside existing systems
 * without breaking them. Gradually integrates reliable completion functions.
 */
export const useUnifiedCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const markVideoComplete = useCallback(async (
    unitId: string,
    courseId: string,
    watchPercentage: number = 100
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('🎯 Unified video completion for unit:', unitId);
      
      // Use the new reliable sync function (with proper error handling)
      try {
        const { data: syncResult, error: syncError } = await supabase.rpc(
          'sync_video_completion_safe' as any, 
          {
            p_user_id: user.id,
            p_unit_id: unitId,
            p_course_id: courseId,
            p_watch_percentage: watchPercentage
          }
        );

        if (syncError) {
          logger.error('❌ Video sync error:', syncError);
          throw syncError;
        } else {
          logger.log('✅ Video completion synced successfully');
        }
      } catch (syncError) {
        logger.error('❌ Video sync failed, using fallback:', syncError);
        // Fallback to existing system
        await fallbackVideoCompletion(unitId, courseId, watchPercentage);
      }

      // Update course progress
      await updateCourseProgressSafely(courseId);

      toast({
        title: "Video Completed! 🎉",
        description: "Your progress has been saved successfully.",
      });

      return true;
    } catch (error) {
      logger.error('❌ Video completion error:', error);
      toast({
        title: "Progress Save Issue",
        description: "We're working to save your progress. Please refresh if it doesn't update.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  const markQuizComplete = useCallback(async (
    quizId: string,
    unitId: string,
    courseId: string,
    score: number,
    answers: any[]
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('📝 Unified quiz completion for unit:', unitId);
      
      // Use the new reliable quiz completion function (with proper error handling)
      try {
        const { data: quizResult, error: quizError } = await supabase.rpc(
          'mark_quiz_complete_reliable' as any, 
          {
            p_user_id: user.id,
            p_quiz_id: quizId,
            p_unit_id: unitId,
            p_course_id: courseId,
            p_score: score,
            p_answers: answers
          }
        );

        if (quizError) {
          logger.error('❌ Quiz completion error:', quizError);
          throw quizError;
        } else {
          logger.log('✅ Quiz completion saved successfully');
        }
      } catch (quizError) {
        logger.error('❌ Quiz completion failed, using fallback:', quizError);
        // Fallback to existing system
        await fallbackQuizCompletion(quizId, unitId, courseId, score);
      }

      // Update course progress
      await updateCourseProgressSafely(courseId);

      toast({
        title: "Quiz Completed! 🎉",
        description: `Great job! You scored ${score}%`,
      });

      return true;
    } catch (error) {
      logger.error('❌ Quiz completion error:', error);
      toast({
        title: "Quiz Save Issue",
        description: "We're working to save your quiz results. Please refresh if it doesn't update.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  const markUnitComplete = useCallback(async (
    unit: Unit,
    courseId: string,
    completionMethod: string = 'manual'
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('🔄 Unified unit completion for unit:', unit.id);
      
      // Use the new reliable unit completion function (with proper error handling)
      try {
        const { data: unitResult, error: unitError } = await supabase.rpc(
          'mark_unit_complete_reliable' as any, 
          {
            p_user_id: user.id,
            p_unit_id: unit.id,
            p_course_id: courseId,
            p_completion_method: completionMethod
          }
        );

        if (unitError) {
          logger.error('❌ Unit completion error:', unitError);
          throw unitError;
        } else {
          logger.log('✅ Unit completion saved successfully');
        }
      } catch (unitError) {
        console.error('❌ Unit completion failed, using fallback:', unitError);
        // Fallback to existing system
        await fallbackUnitCompletion(unit.id, courseId);
      }

      // Update course progress
      await updateCourseProgressSafely(courseId);

      toast({
        title: "Unit Completed! 🎉",
        description: "Great job! You've completed this unit.",
      });

      return true;
    } catch (error) {
      console.error('❌ Unit completion error:', error);
      toast({
        title: "Unit Save Issue",
        description: "We're working to save your progress. Please refresh if it doesn't update.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  // Safe course progress update using new reliable function
  const updateCourseProgressSafely = useCallback(async (courseId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('update_course_progress_reliable' as any, {
        p_user_id: user.id,
        p_course_id: courseId
      });

      if (error) {
        console.error('❌ Course progress update error:', error);
        // Continue silently - don't interrupt user flow
      } else {
        console.log('✅ Course progress updated:', data);
      }
    } catch (error) {
      console.error('❌ Course progress update exception:', error);
      // Continue silently - don't interrupt user flow
    }
  }, [user]);

  // Fallback functions that use existing systems to maintain backwards compatibility
  const fallbackVideoCompletion = useCallback(async (
    unitId: string,
    courseId: string,
    watchPercentage: number
  ) => {
    if (!user) return;

    const completedAt = new Date().toISOString();

    // Update both video progress and unit progress tables directly
    await Promise.all([
      supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          is_completed: true,
          completed_at: completedAt,
          watch_percentage: Math.max(watchPercentage, 95),
          last_watched_at: completedAt,
          updated_at: completedAt
        }, {
          onConflict: 'user_id,unit_id,course_id'
        }),
      supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          video_completed: true,
          video_completed_at: completedAt,
          updated_at: completedAt
        }, {
          onConflict: 'user_id,unit_id,course_id'
        })
    ]);
  }, [user]);

  const fallbackQuizCompletion = useCallback(async (
    quizId: string,
    unitId: string,
    courseId: string,
    score: number
  ) => {
    if (!user) return;

    const completedAt = new Date().toISOString();

    // Update unit progress with quiz completion
    await supabase
      .from('user_unit_progress')
      .upsert({
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        quiz_completed: true,
        quiz_completed_at: completedAt,
        updated_at: completedAt
      }, {
        onConflict: 'user_id,unit_id,course_id'
      });
  }, [user]);

  const fallbackUnitCompletion = useCallback(async (
    unitId: string,
    courseId: string
  ) => {
    if (!user) return;

    const completedAt = new Date().toISOString();

    // Update unit progress
    await supabase
      .from('user_unit_progress')
      .upsert({
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        completed: true,
        completed_at: completedAt,
        updated_at: completedAt
      }, {
        onConflict: 'user_id,unit_id,course_id'
      });
  }, [user]);

  return {
    markVideoComplete,
    markQuizComplete,
    markUnitComplete,
    updateCourseProgressSafely,
    processing
  };
};
