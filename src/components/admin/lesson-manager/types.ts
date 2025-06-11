
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
  image_url?: string;
  files?: Array<{ url: string; name: string; size: number }>;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file?: File;
  newFiles?: File[];
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
