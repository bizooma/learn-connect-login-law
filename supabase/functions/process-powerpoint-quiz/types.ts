
export interface QuizQuestion {
  question_text: string;
  slide_number: number;
  slide_content_used: string;
  options: QuizOption[];
}

export interface QuizOption {
  text: string;
  is_correct: boolean;
}

export interface SlideAnalysis {
  slide_number: number;
  content_extracted: string;
  content_summary: string;
  has_quiz_content: boolean;
}

export interface ExtractedQuizData {
  title: string;
  description: string;
  slides_analyzed: SlideAnalysis[];
  questions: QuizQuestion[];
}

export interface PowerPointImportRecord {
  id: string;
  filename: string;
  file_url: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
