
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CourseWithProgress } from "./types";
import { progressService } from "./progressService";
import { transformProgressData } from "./dataTransformer";
import { useProgressOperations } from "./useProgressOperations";
import { filterCoursesByStatus } from "./stateUpdaters";

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

  const {
    updateCourseProgress,
    calculateCourseProgress,
    markUnitComplete
  } = useProgressOperations(userId, setCourseProgress);

  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    } else {
      setLoading(false);
    }
  }, [userId, fetchUserProgress]);

  const { completedCourses, inProgressCourses, currentCourse } = filterCoursesByStatus(courseProgress);

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
