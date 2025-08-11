
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

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
        console.error('Error checking completion status:', error);
        return null;
      }

      return {
        unitCompleted: data?.completed || false,
        videoCompleted: data?.video_completed || false,
        quizCompleted: data?.quiz_completed || false,
        canComplete: true // Will be determined by strategy
      };
    } catch (error) {
      console.error('Error checking completion status:', error);
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
      console.log('🔄 Marking unit complete:', { unitId, courseId, completionMethod });
      
      // Use the reliable database function
      const { data, error } = await supabase.rpc('mark_unit_complete_reliable', {
        p_unit_id: unitId,
        p_course_id: courseId,
        p_completion_method: completionMethod
      });

      if (error) {
        console.error('❌ Error marking unit complete:', error);
        toast({
          title: "Error",
          description: "Failed to mark unit as complete. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Unit marked complete successfully');
      
      toast({
        title: "Unit Completed! 🎉",
        description: "Great job! You've completed this unit.",
      });

      return true;
    } catch (error) {
      console.error('❌ Error in unit completion:', error);
      toast({
        title: "Error",
        description: "Failed to mark unit as complete. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  const markVideoComplete = useCallback(async (
    unitId: string,
    courseId: string
  ): Promise<boolean> => {
    if (!user || processing) return false;

    try {
      console.log('🎥 Marking video complete:', { unitId, courseId });
      
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
        console.error('❌ Error marking video complete:', error);
        return false;
      }

      console.log('✅ Video marked complete');
      return true;
    } catch (error) {
      console.error('❌ Error in video completion:', error);
      return false;
    }
  }, [user, processing]);

  const markQuizComplete = useCallback(async (
    unitId: string,
    courseId: string,
    retryCount: number = 0
  ): Promise<boolean> => {
    if (!user || processing) return false;

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      console.log('📝 Marking quiz complete:', { unitId, courseId, attempt: retryCount + 1 });
      
      // Special logging for Sara's user ID to track this specific issue
      if (user.id === '7bc548ec-3eca-4f01-9f6b-3f19daa83f27') {
        console.log('🔍 SARA DEBUGGING: Attempting quiz completion', { unitId, courseId, userId: user.id });
      }
      
      // Update quiz completion status with enhanced error handling
      const { data, error } = await supabase
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
        })
        .select();

      if (error) {
        console.error('❌ Error marking quiz complete:', { error, unitId, courseId, attempt: retryCount + 1 });
        
        // Special error logging for Sara
        if (user.id === '7bc548ec-3eca-4f01-9f6b-3f19daa83f27') {
          console.log('🔍 SARA DEBUGGING: Quiz completion failed', { error, unitId, courseId });
        }
        
        // Retry logic for transient errors
        if (retryCount < MAX_RETRIES && (
          error.code === 'PGRST301' || // connection error
          error.code === '23505' || // unique violation (might need retry)
          error.message?.includes('timeout') ||
          error.message?.includes('connection')
        )) {
          console.log(`🔄 Retrying quiz completion in ${RETRY_DELAY}ms (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return markQuizComplete(unitId, courseId, retryCount + 1);
        }
        
        throw error;
      }

      // Verify the record was actually created/updated
      if (!data || data.length === 0) {
        console.warn('⚠️ Quiz completion upsert returned no data, verifying...');
        
        const { data: verification, error: verifyError } = await supabase
          .from('user_unit_progress')
          .select('quiz_completed, quiz_completed_at')
          .eq('user_id', user.id)
          .eq('unit_id', unitId)
          .eq('course_id', courseId)
          .single();
          
        if (verifyError || !verification?.quiz_completed) {
          console.error('❌ Quiz completion verification failed:', { verifyError, verification });
          throw new Error('Quiz completion verification failed');
        }
      }

      console.log('✅ Quiz marked complete successfully', { unitId, courseId, data });
      
      if (user.id === '7bc548ec-3eca-4f01-9f6b-3f19daa83f27') {
        console.log('🔍 SARA DEBUGGING: Quiz completion successful', { unitId, courseId, data });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in quiz completion:', { error, unitId, courseId, attempt: retryCount + 1 });
      
      if (user.id === '7bc548ec-3eca-4f01-9f6b-3f19daa83f27') {
        console.log('🔍 SARA DEBUGGING: Final quiz completion error', { error, unitId, courseId });
      }
      
      // One final retry for unexpected errors
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Final retry for quiz completion (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * 2));
        return markQuizComplete(unitId, courseId, retryCount + 1);
      }
      
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
