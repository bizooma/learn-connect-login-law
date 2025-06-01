
export interface UnitData {
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
  video_file?: File;
  image_url?: string;
}

export interface SectionData {
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  units: UnitData[];
}
