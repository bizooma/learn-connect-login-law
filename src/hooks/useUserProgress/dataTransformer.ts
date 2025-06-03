
import { CourseWithProgress } from "./types";

export const transformProgressData = (progressData: any[]): CourseWithProgress[] => {
  return progressData?.map(progress => {
    if (!progress.courses) {
      console.warn('Course data missing for progress:', progress);
      return null;
    }
    
    return {
      ...progress.courses,
      progress: {
        id: progress.id,
        user_id: progress.user_id,
        course_id: progress.course_id,
        status: progress.status,
        progress_percentage: progress.progress_percentage,
        started_at: progress.started_at,
        completed_at: progress.completed_at,
        last_accessed_at: progress.last_accessed_at,
        created_at: progress.created_at,
        updated_at: progress.updated_at
      }
    };
  }).filter(Boolean) || [];
};
