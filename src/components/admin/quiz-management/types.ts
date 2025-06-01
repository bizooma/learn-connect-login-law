
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;
type Lesson = Tables<'lessons'>;
type Course = Tables<'courses'>;

export interface UnitWithCourse extends Unit {
  lesson: Lesson & {
    course: Course;
  };
}

export interface QuizFormData {
  title: string;
  description: string;
  unit_id: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
}

export interface QuestionFormData {
  question_text: string;
  question_type: 'multiple_choice';
  points: number;
  options: OptionFormData[];
}

export interface OptionFormData {
  option_text: string;
  is_correct: boolean;
}
