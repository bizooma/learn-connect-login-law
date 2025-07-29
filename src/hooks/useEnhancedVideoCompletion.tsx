import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface EnhancedVideoCompletionState {
  isCompleted: boolean;
  isProcessing: boolean;
  watchPercentage: number;
  lastPosition: number;
  completionAttempts: number;
  lastError: string | null;
  canManualOverride: boolean;
}

export const useEnhancedVideoCompletion = (unitId: string, courseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completionState, setCompletionState] = useState<EnhancedVideoCompletionState>({
    isCompleted: false,
    isProcessing: false,
    watchPercentage: 0,
    lastPosition: 0,
    completionAttempts: 0,
    lastError: null,
    canManualOverride: false
  });
  const completionTimeoutRef = useRef<number>();

  // Verify completion in database
  const verifyCompletion = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('user_unit_progress')
        .select('completed, video_completed')
        .eq('user_id', user.id)
        .eq('unit_id', unitId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        logger.error('Error verifying completion:', error);
        return false;
      }

      return data?.completed || data?.video_completed || false;
    } catch (error) {
      logger.error('Exception verifying completion:', error);
      return false;
    }
  }, [user, unitId, courseId]);

  // Enhanced completion with verification and retry
  const markVideoCompleteEnhanced = useCallback(async (forceComplete: boolean = false): Promise<boolean> => {
    if (!user || completionState.isProcessing) return false;

    setCompletionState(prev => ({ 
      ...prev, 
      isProcessing: true,
      completionAttempts: prev.completionAttempts + 1,
      lastError: null
    }));

    logger.log('🎯 Enhanced video completion attempt:', { 
      unitId, 
      forceComplete, 
      attempts: completionState.completionAttempts + 1,
      watchPercentage: completionState.watchPercentage
    });

    try {
      // Strategy 1: Update video progress
      const { error: videoError } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          watch_percentage: Math.max(completionState.watchPercentage, 95),
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      // Strategy 2: Update unit progress
      const { error: unitError } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          video_completed: true,
          video_completed_at: new Date().toISOString(),
          completion_method: forceComplete ? 'manual_override' : 'video_complete',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      // Check if either operation succeeded
      if (videoError && unitError) {
        throw new Error(`Both operations failed: Video: ${videoError.message}, Unit: ${unitError.message}`);
      }

      // Verify the completion was actually saved
      const isVerified = await verifyCompletion();
      
      if (isVerified) {
        setCompletionState(prev => ({ 
          ...prev, 
          isCompleted: true,
          isProcessing: false,
          watchPercentage: Math.max(prev.watchPercentage, 95),
          lastError: null,
          canManualOverride: false
        }));

        toast({
          title: "Video Completed! 🎉",
          description: "Your progress has been saved successfully.",
        });

        logger.log('✅ Enhanced video completion successful and verified');
        return true;
      } else {
        throw new Error('Completion not verified in database');
      }

    } catch (error) {
      logger.error('❌ Enhanced video completion failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setCompletionState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastError: errorMessage,
        canManualOverride: prev.completionAttempts >= 2 // Allow manual override after 2 failed attempts
      }));

      // Show user-friendly error message
      toast({
        title: "Video Completion Issue",
        description: "We're having trouble saving your progress. Please try again or use the manual override button.",
        variant: "destructive",
      });

      return false;
    }
  }, [user, unitId, courseId, completionState.isProcessing, completionState.completionAttempts, completionState.watchPercentage, toast, verifyCompletion]);

  // Manual override for stuck videos
  const forceCompleteVideo = useCallback(async (): Promise<boolean> => {
    logger.log('🎯 Manual override requested for video');
    
    toast({
      title: "Marking Video Complete",
      description: "Attempting manual completion override...",
    });

    return await markVideoCompleteEnhanced(true);
  }, [markVideoCompleteEnhanced, toast]);

  // Enhanced progress tracking with intermediate saves
  const handleVideoProgress = useCallback((currentTime: number, duration: number) => {
    if (duration <= 0) return;

    const watchPercentage = Math.min((currentTime / duration) * 100, 100);
    
    setCompletionState(prev => ({
      ...prev,
      watchPercentage: Math.max(prev.watchPercentage, watchPercentage),
      lastPosition: currentTime
    }));

    // Save intermediate progress at key milestones
    const milestones = [25, 50, 75];
    const currentMilestone = milestones.find(m => 
      watchPercentage >= m && (completionState.watchPercentage < m)
    );

    if (currentMilestone) {
      logger.log(`📊 Saving intermediate progress: ${currentMilestone}%`);
      // Save intermediate progress without completion
      supabase
        .from('user_video_progress')
        .upsert({
          user_id: user?.id,
          unit_id: unitId,
          course_id: courseId,
          watch_percentage: Math.floor(watchPercentage),
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('Failed to save intermediate progress:', error);
          } else {
            logger.log(`✅ Intermediate progress saved: ${currentMilestone}%`);
          }
        });
    }

    // Auto-complete at 95% threshold with debouncing
    if (watchPercentage >= 95 && !completionState.isCompleted && !completionState.isProcessing) {
      // Clear existing timeout
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      // Set new timeout for completion
      completionTimeoutRef.current = window.setTimeout(() => {
        logger.log('🎯 Auto-completing video at 95% threshold');
        markVideoCompleteEnhanced();
      }, 2000); // 2 second delay to ensure stable playback
    }
  }, [completionState.watchPercentage, completionState.isCompleted, completionState.isProcessing, user?.id, unitId, courseId, markVideoCompleteEnhanced]);

  // Handle video ended event
  const handleVideoEnded = useCallback(() => {
    logger.log('🎯 Video ended - triggering completion');
    
    // Clear any pending auto-completion
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    // Mark as complete immediately when video ends
    markVideoCompleteEnhanced();
  }, [markVideoCompleteEnhanced]);

  return {
    completionState,
    handleVideoProgress,
    handleVideoEnded,
    forceCompleteVideo,
    markVideoCompleteEnhanced,
    verifyCompletion
  };
};