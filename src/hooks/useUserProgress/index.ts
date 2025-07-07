
import { useEffect } from "react";
import { useCourseProgress } from "./useCourseProgress";
import { useUnitProgress } from "./useUnitProgress";
import { useProgressStates } from "./useProgressStates";
import { logger } from "@/utils/logger";

export const useUserProgress = (userId?: string) => {
  const {
    courseProgress,
    loading,
    pendingOperations,
    setPendingOperations,
    fetchUserProgress,
    updateCourseProgress,
    calculateCourseProgress
  } = useCourseProgress(userId);

  const { markUnitComplete } = useUnitProgress(
    userId,
    pendingOperations,
    setPendingOperations,
    calculateCourseProgress
  );

  const { completedCourses, inProgressCourses, currentCourse } = useProgressStates(courseProgress);

  useEffect(() => {
    if (userId) {
      logger.log('useUserProgress: Starting to fetch progress for user:', userId);
      fetchUserProgress();
    } else {
      logger.log('useUserProgress: No user ID provided');
    }
  }, [userId, fetchUserProgress]);

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
