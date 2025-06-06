
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CourseWithProgress, CourseProgress } from "./types";
import { progressService } from "./progressService";
import { transformProgressData } from "./dataTransformer";
import { progressCalculator } from "./progressCalculator";

export const useCourseProgress = (userId?: string) => {
  const { toast } = useToast();
  const [courseProgress, setCourseProgress] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const fetchUserProgress = useCallback(async () => {
    if (!userId) {
      console.log('useCourseProgress: No userId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useCourseProgress: Fetching progress for user:', userId);
      
      const progressData = await progressService.fetchUserProgress(userId);
      console.log('useCourseProgress: Raw progress data:', progressData);
      
      const coursesWithProgress = transformProgressData(progressData);
      console.log('useCourseProgress: Transformed courses:', coursesWithProgress);
      
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

    const operationKey = `update-${courseId}`;
    if (pendingOperations.has(operationKey)) {
      console.log('Update operation already pending for course:', courseId);
      return;
    }

    try {
      setPendingOperations(prev => new Set(prev).add(operationKey));
      await progressService.updateCourseProgress(userId, courseId, updates);
      
      // Update local state optimistically
      setCourseProgress(prevProgress => 
        prevProgress.map(course => {
          if (course.id === courseId && course.progress) {
            return {
              ...course,
              progress: {
                ...course.progress,
                ...updates,
                updated_at: new Date().toISOString()
              }
            };
          }
          return course;
        })
      );
    } catch (error) {
      console.error('Error updating course progress:', error);
      if (error.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to update progress",
          variant: "destructive",
        });
      }
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [userId, toast, pendingOperations]);

  const calculateCourseProgress = useCallback(async (courseId: string) => {
    if (!userId) {
      console.warn('Cannot calculate course progress: no user ID');
      return;
    }

    const operationKey = `calculate-${courseId}`;
    if (pendingOperations.has(operationKey)) {
      console.log('Calculate operation already pending for course:', courseId);
      return;
    }

    try {
      setPendingOperations(prev => new Set(prev).add(operationKey));
      const { progressPercentage, status } = await progressCalculator.calculateCourseProgress(userId, courseId);
      
      // Update progress with calculated values
      await progressService.updateCourseProgress(userId, courseId, {
        progress_percentage: progressPercentage,
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        ...(status === 'in_progress' && progressPercentage > 0 && { started_at: new Date().toISOString() })
      });

      // Update local state directly
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
                ...(status === 'in_progress' && progressPercentage > 0 && { started_at: new Date().toISOString() })
              }
            };
          }
          return course;
        })
      );
    } catch (error) {
      console.error('Error calculating course progress:', error);
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  }, [userId, pendingOperations]);

  return {
    courseProgress,
    setCourseProgress,
    loading,
    pendingOperations,
    setPendingOperations,
    fetchUserProgress,
    updateCourseProgress,
    calculateCourseProgress
  };
};
