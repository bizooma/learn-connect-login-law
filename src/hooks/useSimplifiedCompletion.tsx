import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

// Silent background course progress update function
const updateCourseProgressSilently = async (userId: string, courseId: string) => {
  try {
    logger.log('🔄 Updating course progress silently:', { userId, courseId });
    
    const { data, error } = await supabase.rpc('update_course_progress_reliable', {
      p_user_id: userId,
      p_course_id: courseId
    });

    if (error) {
      logger.warn('⚠️ Course progress update failed (non-critical):', error);
    } else {
      logger.log('✅ Course progress updated successfully:', data);
    }
  } catch (error) {
    logger.warn('⚠️ Course progress update error (non-critical):', error);
  }
};

export const useSimplifiedCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const markQuizComplete = useCallback(async (
    unitId: string,
    courseId: string
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('📝 Simple quiz completion:', { unitId, courseId });
      
      // Simple upsert without retry logic to prevent crashes
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
        logger.error('❌ Quiz completion failed:', error);
        return false;
      }

      logger.log('✅ Quiz completed successfully');
      
      // Trigger course progress update in background
      updateCourseProgressSilently(user.id, courseId);
      
      return true;
    } catch (error) {
      logger.error('❌ Quiz completion error:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing]);

  const markUnitComplete = useCallback(async (
    unitId: string,
    courseId: string,
    completionMethod: string = 'manual'
  ): Promise<boolean> => {
    if (!user || processing) return false;

    setProcessing(true);
    
    try {
      logger.log('🔄 Simple unit completion:', { unitId, courseId });
      
      // Simple update without complex RPC calls
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          completion_method: completionMethod,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        logger.error('❌ Unit completion failed:', error);
        toast({
          title: "Error",
          description: "Failed to mark unit as complete.",
          variant: "destructive",
        });
        return false;
      }

      logger.log('✅ Unit completed successfully');
      toast({
        title: "Unit Completed! 🎉",
        description: "Great job! You've completed this unit.",
      });

      // Trigger course progress update in background
      updateCourseProgressSilently(user.id, courseId);

      return true;
    } catch (error) {
      logger.error('❌ Unit completion error:', error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, processing, toast]);

  return {
    markQuizComplete,
    markUnitComplete,
    processing
  };
};