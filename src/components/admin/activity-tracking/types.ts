export interface UserSession {
  id: string;
  user_id: string;
  course_id?: string | null;
  session_start: string;
  session_end?: string | null;
  duration_seconds?: number | null;
  session_type: 'general' | 'course' | 'unit';
  entry_point?: string | null;
  exit_point?: string | null;
  user_email?: string;
  course_title?: string;
  metadata?: Record<string, any>;
  ip_address?: unknown;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionStats {
  user_id: string;
  user_email: string;
  total_sessions: number;
  total_time_seconds: number;
  avg_session_duration: number;
  course_sessions: number;
  general_sessions: number;
  last_activity: string;
}

export interface ActivityFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  courseId?: string;
  sessionType?: string;
  searchTerm?: string;
}

export interface CSVExportOptions {
  reportType: 'sessions' | 'activity' | 'course_access';
  filters: ActivityFilters;
  includeMetadata?: boolean;
}
