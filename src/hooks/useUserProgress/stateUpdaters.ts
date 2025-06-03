
import { CourseWithProgress, CourseProgress } from "./types";

export const updateCourseProgressInState = (
  prevProgress: CourseWithProgress[],
  courseId: string,
  updates: {
    progress_percentage: number;
    status: string;
    completed_at?: string;
    started_at?: string;
  }
): CourseWithProgress[] => {
  return prevProgress.map(course => {
    if (course.id === courseId && course.progress) {
      return {
        ...course,
        progress: {
          ...course.progress,
          progress_percentage: updates.progress_percentage,
          status: updates.status,
          ...(updates.completed_at && { completed_at: updates.completed_at }),
          ...(updates.started_at && { started_at: updates.started_at })
        }
      };
    }
    return course;
  });
};

export const filterCoursesByStatus = (courseProgress: CourseWithProgress[]) => {
  const completedCourses = courseProgress.filter(course => course.progress?.status === 'completed');
  const inProgressCourses = courseProgress.filter(course => course.progress?.status === 'in_progress');
  const currentCourse = inProgressCourses.length > 0 ? inProgressCourses[0] : null;

  return { completedCourses, inProgressCourses, currentCourse };
};
