import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSmartCompletion } from "@/hooks/useSmartCompletion";

interface VideoProgressData {
  watch_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  watched_duration_seconds: number;
  total_duration_seconds: number | null;
}

export const useVideoProgress = (unitId: string, courseId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerSmartCompletion } = useSmartCompletion();
  const [videoProgress, setVideoProgress] = useState<VideoProgressData>({
    watch_percentage: 0,
    is_completed: false,
    completed_at: null,
    watched_duration_seconds: 0,
    total_duration_seconds: null
  });
  const [loading, setLoading] = useState(true);

  const fetchVideoProgress = useCallback(async () => {
    if (!user || !unitId || !courseId) {
      setLoading(false);
      return;
    }

    try {
      // Enhanced query to get both video progress and unit progress
      const [videoProgressResult, unitProgressResult] = await Promise.all([
        supabase
          .from('user_video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('unit_id', unitId)
          .eq('course_id', courseId)
          .maybeSingle(),
        supabase
          .from('user_unit_progress')
          .select('video_completed, video_completed_at')
          .eq('user_id', user.id)
          .eq('unit_id', unitId)
          .eq('course_id', courseId)
          .maybeSingle()
      ]);

      const videoData = videoProgressResult.data;
      const unitData = unitProgressResult.data;

      if (videoProgressResult.error && videoProgressResult.error.code !== 'PGRST116') {
        console.error('Error fetching video progress:', videoProgressResult.error);
        return;
      }

      // Merge data from both sources to get complete picture
      const isCompleted = videoData?.is_completed || unitData?.video_completed || false;
      const completedAt = videoData?.completed_at || unitData?.video_completed_at || null;

      if (videoData || unitData) {
        setVideoProgress({
          watch_percentage: videoData?.watch_percentage || 0,
          is_completed: isCompleted,
          completed_at: completedAt,
          watched_duration_seconds: videoData?.watched_duration_seconds || 0,
          total_duration_seconds: videoData?.total_duration_seconds || null
        });

        // If there's a data inconsistency, fix it
        if (videoData && unitData && videoData.is_completed !== unitData.video_completed) {
          console.log('🔧 Fixing video completion data inconsistency');
          await syncVideoCompletionData(isCompleted);
        }
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
      toast({
        title: "Progress Loading Issue",
        description: "Having trouble loading your video progress. Please refresh if needed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, unitId, courseId, toast]);

  const syncVideoCompletionData = useCallback(async (isCompleted: boolean) => {
    if (!user || !unitId || !courseId) return;

    try {
      const completedAt = isCompleted ? new Date().toISOString() : null;

      // Sync both tables
      await Promise.all([
        supabase
          .from('user_video_progress')
          .upsert({
            user_id: user.id,
            unit_id: unitId,
            course_id: courseId,
            is_completed: isCompleted,
            completed_at: completedAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,unit_id,course_id'
          }),
        supabase
          .from('user_unit_progress')
          .upsert({
            user_id: user.id,
            unit_id: unitId,
            course_id: courseId,
            video_completed: isCompleted,
            video_completed_at: completedAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,unit_id,course_id'
          })
      ]);

      console.log('✅ Video completion data synchronized');
    } catch (error) {
      console.error('❌ Error syncing video completion data:', error);
    }
  }, [user, unitId, courseId]);

  const updateVideoProgress = useCallback(async (
    watchedSeconds: number,
    totalSeconds: number,
    watchPercentage: number
  ) => {
    if (!user || !unitId || !courseId) return;

    try {
      const progressData = {
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        watch_percentage: Math.round(watchPercentage),
        watched_duration_seconds: Math.round(watchedSeconds),
        total_duration_seconds: Math.round(totalSeconds),
        last_watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_video_progress')
        .upsert(progressData, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        console.error('Error updating video progress:', error);
        return;
      }

      // Update local state
      setVideoProgress(prev => ({
        ...prev,
        watch_percentage: Math.round(watchPercentage),
        watched_duration_seconds: Math.round(watchedSeconds),
        total_duration_seconds: Math.round(totalSeconds)
      }));

    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  }, [user, unitId, courseId]);

  const markVideoComplete = useCallback(async () => {
    if (!user || !unitId || !courseId) return;

    try {
      console.log('🎯 Enhanced video completion for unit:', unitId);

      const completedAt = new Date().toISOString();

      // Enhanced completion - update both systems
      const [videoProgressResult, unitProgressResult] = await Promise.all([
        supabase
          .from('user_video_progress')
          .upsert({
            user_id: user.id,
            unit_id: unitId,
            course_id: courseId,
            is_completed: true,
            completed_at: completedAt,
            watch_percentage: Math.max(videoProgress.watch_percentage, 95),
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

      if (videoProgressResult.error || unitProgressResult.error) {
        throw new Error('Failed to update completion status');
      }

      // Update local state
      setVideoProgress(prev => ({
        ...prev,
        is_completed: true,
        completed_at: completedAt,
        watch_percentage: Math.max(prev.watch_percentage, 95)
      }));

      // Show success message
      toast({
        title: "Video Completed! 🎉",
        description: "Your progress has been saved successfully.",
      });

      // Trigger smart completion system
      const { data: unit } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

      const { data: quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .maybeSingle();

      if (unit) {
        await triggerSmartCompletion(unit, courseId, !!quiz, 'video_complete');
      }

    } catch (error) {
      console.error('❌ Enhanced video completion failed:', error);
      toast({
        title: "Completion Issue",
        description: "We're having trouble saving your progress. Please try again or refresh the page.",
        variant: "destructive",
      });
    }
  }, [user, unitId, courseId, videoProgress.watch_percentage, toast, triggerSmartCompletion]);

  useEffect(() => {
    fetchVideoProgress();
  }, [fetchVideoProgress]);

  // Enhanced display percentage that shows 100% when video is completed
  const getDisplayPercentage = useCallback(() => {
    if (videoProgress.is_completed) {
      return 100;
    }
    return videoProgress.watch_percentage;
  }, [videoProgress.is_completed, videoProgress.watch_percentage]);

  return {
    videoProgress: {
      ...videoProgress,
      displayPercentage: getDisplayPercentage()
    },
    loading,
    updateVideoProgress,
    markVideoComplete,
    fetchVideoProgress,
    syncVideoCompletionData
  };
};