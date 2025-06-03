
export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  course_id?: string | null;
  unit_id?: string | null;
  quiz_id?: string | null;
  session_id?: string | null;
  duration_seconds?: number | null;
  metadata?: any;
  created_at: string;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  courses?: {
    title: string;
  } | null;
  units?: {
    title: string;
  } | null;
}

export interface ActivityStats {
  totalActivities: number;
  activeUsers: number;
  avgSessionDuration: number;
  topActivity: string;
}

export type ActivityType = "login" | "logout" | "course_access" | "unit_access" | "unit_complete" | "quiz_start" | "quiz_complete" | "video_play" | "video_pause" | "video_complete" | "page_view";
