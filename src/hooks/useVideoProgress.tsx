
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

    const isCompleted = watchPercentage >= 95; // Consider video completed at 95%

    try {
      const progressData = {
        user_id: user.id,
        unit_id: unitId,
        course_id: courseId,
        watch_percentage: Math.round(watchPercentage),
        watched_duration_seconds: Math.round(watchedSeconds),
        total_duration_seconds: Math.round(totalSeconds),
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
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
        total_duration_seconds: Math.round(totalSeconds),
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : prev.completed_at
      }));

      // Update unit progress table if video is completed
      if (isCompleted) {
        await updateUnitVideoCompletion();
      }

    } catch (error) {
      console.error('Error updating video progress:', error);
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

    } catch (error) {
      console.error('Error updating unit video completion:', error);
    }
  }, [user, unitId, courseId, toast]);

  useEffect(() => {
    fetchVideoProgress();
  }, [fetchVideoProgress]);

  return {
    videoProgress,
    loading,
    updateVideoProgress,
    fetchVideoProgress
  };
};
