
import { progressService } from "./progressService";
import { CourseProgress } from "./types";

export const calculateCourseProgressUtil = async (
  userId: string, 
  courseId: string, 
  updateProgressCallback: (courseId: string, updates: Partial<CourseProgress>) => Promise<void>
) => {
  if (!userId) {
    return;
  }

  try {
    const { progressPercentage, status } = await progressService.calculateCourseProgress(userId, courseId);
    
    // Update progress directly without triggering a full refetch
    await updateProgressCallback(courseId, {
      progress_percentage: progressPercentage,
      status,
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(status === 'in_progress' && progressPercentage === 1 && { started_at: new Date().toISOString() })
    });

    return { progressPercentage, status };
  } catch (error) {
    console.error('Error calculating course progress:', error);
    throw error;
  }
};
