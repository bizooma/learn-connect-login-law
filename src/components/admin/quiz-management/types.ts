
import { Tables } from "@/integrations/supabase/types";

export type Quiz = Tables<'quizzes'>;
export type QuizQuestion = Tables<'quiz_questions'>;
export type QuizQuestionOption = Tables<'quiz_question_options'>;

export interface UnitWithCourse {
  id: string;
  title: string;
  lesson?: {
    id: string;
    title: string;
    course?: {
      id: string;
      title: string;
    };
  };
}

export interface QuizWithDetails extends Quiz {
  unit?: UnitWithCourse;
  quiz_questions?: Array<{ id: string }>;
}

export interface QuizFormData {
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
  unit_id?: string; // Now optional
}

export interface ImportedQuizData {
  title: string;
  description?: string;
  questions: {
    question_text: string;
    options: {
      option_text: string;
      is_correct: boolean;
    }[];
  }[];
}
