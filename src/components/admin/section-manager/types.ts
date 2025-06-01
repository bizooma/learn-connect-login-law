
export interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}

export interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz?: QuizData;
}

export interface QuizData {
  id?: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
  questions: QuestionData[];
}

export interface QuestionData {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice';
  points: number;
  sort_order: number;
  options: OptionData[];
}

export interface OptionData {
  id?: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}
