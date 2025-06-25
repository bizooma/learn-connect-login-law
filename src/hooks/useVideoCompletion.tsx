
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VideoCompletionState {
  isCompleted: boolean;
  watchPercentage: number;
  lastPosition: number;
  completionAttempts: number;
}

export const useVideoCompletion = (unitId: string, courseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completionState, setCompletionState] = useState<VideoCompletionState>({
    isCompleted: false,
    watchPercentage: 0,
    lastPosition: 0,
    completionAttempts: 0
  });
  const completionTimeoutRef = useRef<number>();

  const markVideoCompleteReliable = useCallback(async (forceComplete: boolean = false) => {
    if (!user || !unitId || !courseId) return false;

    console.log('🎯 Attempting reliable video completion:', { unitId, forceComplete, attempts: completionState.completionAttempts });

    try {
      // Update completion attempts
      setCompletionState(prev => ({ 
        ...prev, 
        completionAttempts: prev.completionAttempts + 1 
      }));

      // Multiple completion strategies
      const completionPromises = [];

      // 1. Update video progress table
      completionPromises.push(
        supabase
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
          })
      );

      // 2. Update unit progress table with video completion
      completionPromises.push(
        supabase
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
          })
      );

      // Execute all completion strategies
      const results = await Promise.allSettled(completionPromises);

      // Check if at least one succeeded
      const hasSuccess = results.some(result => result.status === 'fulfilled');

      if (hasSuccess) {
        setCompletionState(prev => ({ 
          ...prev, 
          isCompleted: true,
          watchPercentage: Math.max(prev.watchPercentage, 95)
        }));

        toast({
          title: "Video Completed! 🎉",
          description: "Your progress has been saved successfully.",
        });

        console.log('✅ Video completion successful');
        return true;
      } else {
        throw new Error('All completion strategies failed');
      }

    } catch (error) {
      console.error('❌ Video completion failed:', error);
      
      // Show user-friendly error
      toast({
        title: "Video Completion Issue",
        description: "We're having trouble saving your progress. Please try refreshing the page.",
        variant: "destructive",
      });

      return false;
    }
  }, [user, unitId, courseId, completionState.completionAttempts, completionState.watchPercentage, toast]);

  const handleVideoProgress = useCallback((currentTime: number, duration: number) => {
    if (duration <= 0) return;

    const watchPercentage = Math.min((currentTime / duration) * 100, 100);
    
    setCompletionState(prev => ({
      ...prev,
      watchPercentage: Math.max(prev.watchPercentage, watchPercentage),
      lastPosition: currentTime
    }));

    // Auto-complete at 95% threshold with debouncing
    if (watchPercentage >= 95 && !completionState.isCompleted) {
      // Clear existing timeout
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      // Set new timeout for completion
      completionTimeoutRef.current = window.setTimeout(() => {
        console.log('🎯 Auto-completing video at 95% threshold');
        markVideoCompleteReliable();
      }, 2000); // 2 second delay to ensure stable playback
    }
  }, [completionState.isCompleted, markVideoCompleteReliable]);

  const handleVideoEnded = useCallback(() => {
    console.log('🎯 Video ended - triggering completion');
    
    // Clear any pending auto-completion
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }

    // Mark as complete immediately when video ends
    markVideoCompleteReliable();
  }, [markVideoCompleteReliable]);

  const forceComplete = useCallback(() => {
    console.log('🎯 Force completing video manually');
    return markVideoCompleteReliable(true);
  }, [markVideoCompleteReliable]);

  return {
    completionState,
    handleVideoProgress,
    handleVideoEnded,
    forceComplete,
    markVideoCompleteReliable
  };
};
