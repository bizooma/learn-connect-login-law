
import { useMemo } from "react";
import { CourseWithProgress } from "./types";

export const useProgressStates = (courseProgress: CourseWithProgress[]) => {
  const completedCourses = useMemo(
    () => courseProgress.filter(course => course.progress?.status === 'completed'),
    [courseProgress]
  );

  const inProgressCourses = useMemo(
    () => courseProgress.filter(course => course.progress?.status === 'in_progress'),
    [courseProgress]
  );

  const currentCourse = useMemo(
    () => inProgressCourses.length > 0 ? inProgressCourses[0] : null,
    [inProgressCourses]
  );

  return {
    completedCourses,
    inProgressCourses,
    currentCourse
  };
};
