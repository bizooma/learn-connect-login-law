
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CourseWithProgress } from "./types";
import { transformProgressData } from "./dataTransformer";
import { progressCalculator } from "./progressCalculator";
import { logger } from "@/utils/logger";

export const useCourseProgress = (userId?: string) => {
  const [courseProgress, setCourseProgress] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(new Set<string>());

  const fetchUserProgress = useCallback(async () => {
    if (!userId) {
      logger.log('useCourseProgress: No userId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.log('useCourseProgress: Fetching progress for user:', userId);

      // Get user progress with course data
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId);

      if (progressError) {
        logger.error('Error fetching user progress:', progressError);
        throw progressError;
      }

      logger.log('useCourseProgress: Raw progress data from DB:', progressData);

      // Transform the data to CourseWithProgress format
      const transformedData = transformProgressData(progressData || []);
      logger.log('useCourseProgress: Transformed progress data:', transformedData);

      setCourseProgress(transformedData);
    } catch (error) {
      logger.error('Error in fetchUserProgress:', error);
      setCourseProgress([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateCourseProgress = useCallback(async (courseId: string, status: string, progressPercentage: number) => {
    if (!userId) {
      logger.warn('Cannot update course progress: no user ID');
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
      logger.error('Error updating course progress:', error);
      throw error;
    }
  }, [userId, fetchUserProgress]);

  const calculateCourseProgress = useCallback(async (courseId: string) => {
    if (!userId) {
      logger.warn('Cannot calculate course progress: no user ID');
      return;
    }

    try {
      logger.log('Calculating course progress and checking for completion...');
      const { progressPercentage, status } = await progressCalculator.calculateCourseProgress(userId, courseId);
      
      // Update the course progress with the calculated values
      await updateCourseProgress(courseId, status, progressPercentage);
      
      // If course is completed, show success message
      if (status === 'completed') {
        logger.log('🎉 Course completed! Certificate is now available for download.');
      }
    } catch (error) {
      logger.error('Error calculating course progress:', error);
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
