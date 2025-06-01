
export interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_file?: File;
}

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
  quiz_id?: string; // Reference to existing quiz
}
