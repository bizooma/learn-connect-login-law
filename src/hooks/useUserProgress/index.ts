
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
      return;
    }

    try {
      await progressService.updateCourseProgress(userId, courseId, updates);
      // Don't refetch immediately to avoid loops - the data will be updated on next navigation or manual refresh
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
  }, [userId, toast]);

  const calculateCourseProgress = useCallback(async (courseId: string) => {
    if (!userId) {
      return;
    }

    try {
      const { progressPercentage, status } = await progressService.calculateCourseProgress(userId, courseId);
      
      // Update progress directly without triggering a full refetch
      await progressService.updateCourseProgress(userId, courseId, {
        progress_percentage: progressPercentage,
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(status === 'in_progress' && progressPercentage === 1 && { started_at: new Date().toISOString() })
      });

      // Update local state directly instead of refetching
      setCourseProgress(prevProgress => 
        prevProgress.map(course => {
          if (course.id === courseId && course.progress) {
            return {
              ...course,
              progress: {
                ...course.progress,
                progress_percentage: progressPercentage,
                status,
                ...(status === 'completed' && { completed_at: new Date().toISOString() }),
                ...(status === 'in_progress' && progressPercentage === 1 && { started_at: new Date().toISOString() })
              }
            };
          }
          return course;
        })
      );
    } catch (error) {
      console.error('Error calculating course progress:', error);
    }
  }, [userId]);

  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!userId) {
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
  }, [userId, calculateCourseProgress, toast]);

  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    } else {
      setLoading(false);
    }
  }, [userId, fetchUserProgress]);

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
