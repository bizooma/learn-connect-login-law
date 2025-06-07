
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface CompletionRequirements {
  hasVideo: boolean;
  hasQuiz: boolean;
  completionStrategy: 'video_only' | 'quiz_only' | 'video_and_quiz' | 'manual_only';
}

interface CompletionStatus {
  videoCompleted: boolean;
  quizCompleted: boolean;
  manualCompleted: boolean;
  overallCompleted: boolean;
}

export const useSmartCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const analyzeCompletionRequirements = useCallback((unit: Unit, hasQuiz: boolean): CompletionRequirements => {
    const hasVideo = !!unit.video_url;
    
    let completionStrategy: CompletionRequirements['completionStrategy'];
    
    if (hasVideo && hasQuiz) {
      // Both video and quiz - require both for full completion
      completionStrategy = 'video_and_quiz';
    } else if (hasVideo && !hasQuiz) {
      // Video only - auto-complete when video is watched
      completionStrategy = 'video_only';
    } else if (!hasVideo && hasQuiz) {
      // Quiz only - auto-complete when quiz is passed
      completionStrategy = 'quiz_only';
    } else {
      // No video or quiz - manual completion only
      completionStrategy = 'manual_only';
    }

    return {
      hasVideo,
      hasQuiz,
      completionStrategy
    };
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
        console.error('Error checking completion status:', error);
        return null;
      }

      return {
        videoCompleted: data?.video_completed || false,
        quizCompleted: data?.quiz_completed || false,
        manualCompleted: data?.completed || false,
        overallCompleted: data?.completed || false
      };
    } catch (error) {
      console.error('Error checking completion status:', error);
      return null;
    }
  }, [user]);

  const evaluateSmartCompletion = useCallback(async (
    unit: Unit,
    courseId: string,
    hasQuiz: boolean
  ): Promise<boolean> => {
    if (!user) return false;

    const requirements = analyzeCompletionRequirements(unit, hasQuiz);
    const status = await checkCompletionStatus(unit.id, courseId);
    
    if (!status) return false;

    console.log('Smart completion evaluation:', {
      unitId: unit.id,
      strategy: requirements.completionStrategy,
      status,
      requirements
    });

    switch (requirements.completionStrategy) {
      case 'video_only':
        return status.videoCompleted;
      
      case 'quiz_only':
        return status.quizCompleted;
      
      case 'video_and_quiz':
        return status.videoCompleted && status.quizCompleted;
      
      case 'manual_only':
        return status.manualCompleted;
      
      default:
        return false;
    }
  }, [user, analyzeCompletionRequirements, checkCompletionStatus]);

  const triggerSmartCompletion = useCallback(async (
    unit: Unit,
    courseId: string,
    hasQuiz: boolean,
    triggerEvent: 'video_complete' | 'quiz_complete'
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      const shouldComplete = await evaluateSmartCompletion(unit, courseId, hasQuiz);
      
      if (shouldComplete) {
        console.log('Smart completion triggered for unit:', unit.id);
        
        const { error } = await supabase
          .from('user_unit_progress')
          .upsert({
            user_id: user.id,
            unit_id: unit.id,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
            completion_method: `auto_${triggerEvent}`,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,unit_id,course_id'
          });

        if (error) {
          console.error('Error triggering smart completion:', error);
          return false;
        }

        const requirements = analyzeCompletionRequirements(unit, hasQuiz);
        const completionMessage = getCompletionMessage(requirements.completionStrategy, triggerEvent);
        
        toast({
          title: "Unit Completed! 🎉",
          description: completionMessage,
        });

        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in smart completion:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, evaluateSmartCompletion, toast, analyzeCompletionRequirements]);

  const getCompletionMessage = (
    strategy: CompletionRequirements['completionStrategy'], 
    triggerEvent: 'video_complete' | 'quiz_complete'
  ): string => {
    switch (strategy) {
      case 'video_only':
        return "Great job! You've completed this unit by watching the video.";
      case 'quiz_only':
        return "Excellent! You've completed this unit by passing the quiz.";
      case 'video_and_quiz':
        return triggerEvent === 'video_complete' 
          ? "Video completed! You've finished all requirements for this unit."
          : "Quiz passed! You've finished all requirements for this unit.";
      default:
        return "Unit completed!";
    }
  };

  return {
    analyzeCompletionRequirements,
    checkCompletionStatus,
    evaluateSmartCompletion,
    triggerSmartCompletion,
    processing
  };
};
