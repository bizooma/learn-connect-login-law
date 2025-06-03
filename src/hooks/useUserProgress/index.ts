
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CourseWithProgress, CourseProgress } from "./types";
import { progressService } from "./progressService";
import { transformProgressData } from "./dataTransformer";

export const useUserProgress = (userId?: string) => {
  const { toast } = useToast();
  const [courseProgress, setCourseProgress] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProgress = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const progressData = await progressService.fetchUserProgress(userId);
      const coursesWithProgress = transformProgressData(progressData);
      setCourseProgress(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      toast({
        title: "Error",
        description: "Failed to load course progress",
        variant: "destructive",
      });
      setCourseProgress([]);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const updateCourseProgress = useCallback(async (courseId: string, updates: Partial<CourseProgress>) => {
    if (!userId) {
      console.warn('Cannot update course progress: no user ID');
      return;
    }

    try {
      await progressService.updateCourseProgress(userId, courseId, updates);
      await fetchUserProgress();
    } catch (error) {
      console.error('Error updating course progress:', error);
      if (error.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to update progress",
          variant: "destructive",
        });
      }
    }
  }, [userId, fetchUserProgress, toast]);

  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!userId) {
      console.warn('Cannot mark unit complete: no user ID');
      return;
    }

    try {
      await progressService.markUnitComplete(userId, unitId, courseId);
      await calculateCourseProgress(courseId);
    } catch (error) {
      console.error('Error marking unit complete:', error);
      if (error.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to mark unit as complete",
          variant: "destructive",
        });
      }
    }
  }, [userId, toast]);

  const calculateCourseProgress = useCallback(async (courseId: string) => {
    if (!userId) {
      console.warn('Cannot calculate course progress: no user ID');
      return;
    }

    try {
      const { progressPercentage, status } = await progressService.calculateCourseProgress(userId, courseId);
      
      await updateCourseProgress(courseId, {
        progress_percentage: progressPercentage,
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(status === 'in_progress' && progressPercentage === 1 && { started_at: new Date().toISOString() })
      });
    } catch (error) {
      console.error('Error calculating course progress:', error);
    }
  }, [userId, updateCourseProgress]);

  useEffect(() => {
    if (userId) {
      console.log('useUserProgress: Starting to fetch progress for user:', userId);
      fetchUserProgress();
    } else {
      console.log('useUserProgress: No user ID provided');
      setLoading(false);
    }
  }, [fetchUserProgress]);

  const completedCourses = courseProgress.filter(course => course.progress?.status === 'completed');
  const inProgressCourses = courseProgress.filter(course => course.progress?.status === 'in_progress');
  const currentCourse = inProgressCourses.length > 0 ? inProgressCourses[0] : null;

  return {
    courseProgress,
    completedCourses,
    inProgressCourses,
    currentCourse,
    loading,
    updateCourseProgress,
    markUnitComplete,
    fetchUserProgress
  };
};
