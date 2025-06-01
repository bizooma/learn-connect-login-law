
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface CourseWithContent extends Course {
  modules: (Module & {
    lessons: (Lesson & {
      units: (Unit & {
        quizzes: Quiz[];
      })[];
    })[];
  })[];
}

export const collectDraggableItems = (courses: CourseWithContent[]): string[] => {
  return courses.flatMap(course => [
    `course-${course.id}`,
    ...course.modules.flatMap(module => [
      `module-${module.id}`,
      ...module.lessons.flatMap(lesson => [
        `lesson-${lesson.id}`,
        ...lesson.units.map(unit => `unit-${unit.id}`)
      ])
    ])
  ]);
};
