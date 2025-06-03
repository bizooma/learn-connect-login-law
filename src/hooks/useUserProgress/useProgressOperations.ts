
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { progressService } from "./progressService";
import { CourseProgress } from "./types";
import { calculateCourseProgressUtil } from "./calculateProgress";

export const useProgressOperations = (
  userId: string | undefined,
  setCourseProgress: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const { toast } = useToast();

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
      const result = await calculateCourseProgressUtil(userId, courseId, updateCourseProgress);
      
      if (result) {
        // Update local state directly instead of refetching
        setCourseProgress(prevProgress => 
          prevProgress.map(course => {
            if (course.id === courseId && course.progress) {
              return {
                ...course,
                progress: {
                  ...course.progress,
                  progress_percentage: result.progressPercentage,
                  status: result.status,
                  ...(result.status === 'completed' && { completed_at: new Date().toISOString() }),
                  ...(result.status === 'in_progress' && result.progressPercentage === 1 && { started_at: new Date().toISOString() })
                }
              };
            }
            return course;
          })
        );
      }
    } catch (error) {
      console.error('Error calculating course progress:', error);
    }
  }, [userId, updateCourseProgress, setCourseProgress]);

  const markUnitComplete = useCallback(async (unitId: string, courseId: string) => {
    if (!userId) {
      return;
    }

    try {
      await progressService.markUnitComplete(userId, unitId, courseId);
      
      // Log unit completion activity
      const { useActivityTracking } = await import("@/hooks/useActivityTracking");
      const { logUnitComplete } = useActivityTracking();
      logUnitComplete(unitId, courseId);
      
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

  return {
    updateCourseProgress,
    calculateCourseProgress,
    markUnitComplete
  };
};
