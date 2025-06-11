
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
  files?: Array<{ url: string; name: string; size: number }>;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file?: File;
  newFiles?: File[];
  image_url?: string;
  quiz_id?: string;
  _deletedInForm?: boolean;
  _lastFilesUpdate?: number;
}

export interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  video_url?: string;
  video_type?: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes?: number;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean;
}

export interface QuizData {
  id?: string;
  title: string;
  description: string;
  questions: QuestionData[];
}

export interface QuestionData {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: OptionData[];
}

export interface OptionData {
  id?: string;
  option_text: string;
  is_correct: boolean;
}
