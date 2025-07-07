
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface CompletionRequirements {
  hasVideo: boolean;
  hasQuiz: boolean;
  strategy: 'video_only' | 'quiz_only' | 'video_and_quiz' | 'manual_only';
}

interface CompletionStatus {
  unitCompleted: boolean;
  videoCompleted: boolean;
  quizCompleted: boolean;
  canComplete: boolean;
}

export const useReliableCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const analyzeUnit = useCallback((unit: Unit, hasQuiz: boolean): CompletionRequirements => {
    const hasVideo = !!unit.video_url;
    
    let strategy: CompletionRequirements['strategy'];
    if (hasVideo && hasQuiz) {
      strategy = 'video_and_quiz';
    } else if (hasVideo && !hasQuiz) {
      strategy = 'video_only';
    } else if (!hasVideo && hasQuiz) {
      strategy = 'quiz_only';
    } else {
      strategy = 'manual_only';
    }

    return { hasVideo, hasQuiz, strategy };
  }, []);

  const checkCompletionStatus = useCallback(async (
    unitId: string, 
    courseId: string
  ): Promise<CompletionStatus | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_unit_progress')
        .select('completed, video_completed, quiz_completed')
        .eq('user_id', user.id)
        .eq('unit_id', unitId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking completion status:', error);
        return null;
      }

      return {
        unitCompleted: data?.completed || false,
        videoCompleted: data?.video_completed || false,
        quizCompleted: data?.quiz_completed || false,
        canComplete: true // Will be determined by strategy
      };
    } catch (error) {
      logger.error('Error checking completion status:', error);
      return null;
    }
  }, [user]);

  const markUnitComplete = useCallback(async (
    unitId: string,
    courseId: string,
    completionMethod: string = 'manual'
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('🔄 Marking unit complete:', { unitId, courseId, completionMethod });
      
      // Use the reliable database function
      const { data, error } = await supabase.rpc('mark_unit_complete_reliable', {
        p_user_id: user.id,
        p_unit_id: unitId,
        p_course_id: courseId,
        p_completion_method: completionMethod
      });

      if (error) {
        logger.error('❌ Error marking unit complete:', error);
        toast({
          title: "Error",
          description: "Failed to mark unit as complete. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      logger.log('✅ Unit marked complete successfully');
      
      toast({
        title: "Unit Completed! 🎉",
        description: "Great job! You've completed this unit.",
      });

      return true;
    } catch (error) {
      logger.error('❌ Error in unit completion:', error);
      toast({
        title: "Error",
        description: "Failed to mark unit as complete. Please try again.",
        variant: "destructive",
      });
      return false;
    }finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  const markVideoComplete = useCallback(async (
    unitId: string,
    courseId: string
  ): Promise<boolean> => {
    if (!user || processing) return false;

    try {
      logger.log('🎥 Marking video complete:', { unitId, courseId });
      
      // Update video completion status
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          video_completed: true,
          video_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        logger.error('❌ Error marking video complete:', error);
        return false;
      }

      logger.log('✅ Video marked complete');
      return true;
    } catch (error) {
      logger.error('❌ Error in video completion:', error);
      return false;
    }
  }, [user, processing]);

  const markQuizComplete = useCallback(async (
    unitId: string,
    courseId: string
  ): Promise<boolean> => {
    if (!user || processing) return false;

    try {
      console.log('📝 Marking quiz complete:', { unitId, courseId });
      
      // Update quiz completion status
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          quiz_completed: true,
          quiz_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        console.error('❌ Error marking quiz complete:', error);
        return false;
      }

      console.log('✅ Quiz marked complete');
      return true;
    } catch (error) {
      console.error('❌ Error in quiz completion:', error);
      return false;
    }
  }, [user, processing]);

  const evaluateAndCompleteUnit = useCallback(async (
    unit: Unit,
    courseId: string,
    hasQuiz: boolean,
    triggerEvent: 'video_complete' | 'quiz_complete' | 'manual'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const requirements = analyzeUnit(unit, hasQuiz);
      const status = await checkCompletionStatus(unit.id, courseId);
      
      if (!status) return false;

      console.log('🔍 Evaluating unit completion:', {
        unitId: unit.id,
        strategy: requirements.strategy,
        status,
        triggerEvent
      });

      // Determine if unit should be completed based on strategy
      let shouldComplete = false;
      let completionMethod = triggerEvent;

      switch (requirements.strategy) {
        case 'video_only':
          shouldComplete = status.videoCompleted || triggerEvent === 'video_complete';
          break;
        
        case 'quiz_only':
          shouldComplete = status.quizCompleted || triggerEvent === 'quiz_complete';
          break;
        
        case 'video_and_quiz':
          // Both must be completed
          const videoWillBeComplete = status.videoCompleted || triggerEvent === 'video_complete';
          const quizWillBeComplete = status.quizCompleted || triggerEvent === 'quiz_complete';
          shouldComplete = videoWillBeComplete && quizWillBeComplete;
          break;
        
        case 'manual_only':
          shouldComplete = triggerEvent === 'manual';
          break;
      }

      if (shouldComplete && !status.unitCompleted) {
        return await markUnitComplete(unit.id, courseId, `auto_${completionMethod}`);
      }

      return false;
    } catch (error) {
      console.error('❌ Error in unit evaluation:', error);
      return false;
    }
  }, [user, analyzeUnit, checkCompletionStatus, markUnitComplete]);

  const updateCourseProgress = useCallback(async (
    courseId: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('📊 Updating course progress:', courseId);
      
      const { data, error } = await supabase.rpc('update_course_progress_reliable', {
        p_user_id: user.id,
        p_course_id: courseId
      });

      if (error) {
        console.error('❌ Error updating course progress:', error);
        return false;
      }

      console.log('✅ Course progress updated');
      return true;
    } catch (error) {
      console.error('❌ Error in course progress update:', error);
      return false;
    }
  }, [user]);

  return {
    analyzeUnit,
    checkCompletionStatus,
    markUnitComplete,
    markVideoComplete,
    markQuizComplete,
    evaluateAndCompleteUnit,
    updateCourseProgress,
    processing
  };
};
