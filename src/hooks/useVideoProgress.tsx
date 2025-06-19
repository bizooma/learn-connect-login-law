
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
      const { data, error } = await supabase
        .from('user_video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('unit_id', unitId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video progress:', error);
        return;
      }

      if (data) {
        setVideoProgress({
          watch_percentage: data.watch_percentage,
          is_completed: data.is_completed,
          completed_at: data.completed_at,
          watched_duration_seconds: data.watched_duration_seconds,
          total_duration_seconds: data.total_duration_seconds
        });
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
    } finally {
      setLoading(false);
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
        is_completed: false, // Only set to true via markVideoComplete
        completed_at: null, // Only set via markVideoComplete
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

      // Update local state (but don't mark as completed)
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
      console.log('Marking video as complete for unit:', unitId);

      // Update video progress to completed
      const { error: progressError } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: user.id,
          unit_id: unitId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (progressError) {
        console.error('Error marking video progress complete:', progressError);
        return;
      }

      // Update unit progress
      await updateUnitVideoCompletion();

      // Update local state
      setVideoProgress(prev => ({
        ...prev,
        is_completed: true,
        completed_at: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error marking video complete:', error);
    }
  }, [user, unitId, courseId]);

  const updateUnitVideoCompletion = useCallback(async () => {
    if (!user || !unitId || !courseId) return;

    try {
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
        console.error('Error updating unit video completion:', error);
        return;
      }

      toast({
        title: "Video Completed! 🎉",
        description: "You've successfully watched this video to completion.",
      });

      // Get unit data and check for quiz to trigger smart completion
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
      console.error('Error updating unit video completion:', error);
    }
  }, [user, unitId, courseId, toast, triggerSmartCompletion]);

  useEffect(() => {
    fetchVideoProgress();
  }, [fetchVideoProgress]);

  return {
    videoProgress,
    loading,
    updateVideoProgress,
    markVideoComplete,
    fetchVideoProgress
  };
};
