
import { Tables } from "@/integrations/supabase/types";

export type CourseProgress = Tables<'user_course_progress'>;
export type UnitProgress = Tables<'user_unit_progress'>;
export type Course = Tables<'courses'>;

export interface CourseWithProgress extends Course {
  progress?: CourseProgress;
}
