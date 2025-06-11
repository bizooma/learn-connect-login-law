
import { Course } from "@/integrations/supabase/types";

export interface CourseFormData extends Omit<Course, 'id' | 'created_at'> {
  image_file: File | null;
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
  image_url?: string;
  quiz_id?: string;
  _deletedInForm?: boolean; // Track form-level deletions
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
  image_file?: File;
  file?: File;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean; // Track form-level deletions
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
  _deletedInForm?: boolean; // Track form-level deletions
}

// Legacy interface for backward compatibility
export interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean; // Track form-level deletions
}
