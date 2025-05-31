
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
}

export interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}
