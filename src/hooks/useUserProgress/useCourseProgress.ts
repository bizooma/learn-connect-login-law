
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CourseWithProgress } from "./types";
import { transformProgressData } from "./dataTransformer";
import { progressCalculator } from "./progressCalculator";

export const useCourseProgress = (userId?: string) => {
  const [courseProgress, setCourseProgress] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(new Set<string>());

  const fetchUserProgress = useCallback(async () => {
    if (!userId) {
      console.log('useCourseProgress: No userId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useCourseProgress: Fetching progress for user:', userId);

      // Get user progress with course data
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId);

      if (progressError) {
        console.error('Error fetching user progress:', progressError);
        throw progressError;
      }

      console.log('useCourseProgress: Raw progress data from DB:', progressData);

      // Transform the data to CourseWithProgress format
      const transformedData = transformProgressData(progressData || []);
      console.log('useCourseProgress: Transformed progress data:', transformedData);

      setCourseProgress(transformedData);
    } catch (error) {
      console.error('Error in fetchUserProgress:', error);
      setCourseProgress([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateCourseProgress = useCallback(async (courseId: string, status: string, progressPercentage: number) => {
    if (!userId) {
      console.warn('Cannot update course progress: no user ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          status,
          progress_percentage: progressPercentage,
          last_accessed_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() }),
          ...(status === 'in_progress' && !progressPercentage && { started_at: new Date().toISOString() })
        });

      if (error) throw error;

      // Refresh the data
      await fetchUserProgress();
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }, [userId, fetchUserProgress]);

  const calculateCourseProgress = useCallback(async (courseId: string) => {
    if (!userId) {
      console.warn('Cannot calculate course progress: no user ID');
      return;
    }

    try {
      const { progressPercentage, status } = await progressCalculator.calculateCourseProgress(userId, courseId);
      await updateCourseProgress(courseId, status, progressPercentage);
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  }, [userId, updateCourseProgress]);

  return {
    courseProgress,
    loading,
    pendingOperations,
    setPendingOperations,
    fetchUserProgress,
    updateCourseProgress,
    calculateCourseProgress
  };
};
