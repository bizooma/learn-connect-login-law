
export interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_url: string;
  image_file: File | null;
  tags: string[];
  is_draft: boolean;
  students_enrolled: number;
  rating: number;
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
  files?: Array<{ url: string; name: string; size: number }>;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file?: File;
  newFiles?: File[];
  file_uploads?: File[];
  image_url?: string;
  quiz_id?: string;
  _deletedInForm?: boolean;
  _lastFilesUpdate?: number;
}

export interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  video_url?: string;
  video_type?: 'youtube' | 'upload';
  duration_minutes?: number;
  image_file?: File;
  file?: File;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean;
}

export interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  image_file?: File;
  file?: File;
  sort_order: number;
  lessons: LessonData[];
  _deletedInForm?: boolean;
}

// Legacy interface for backward compatibility
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
