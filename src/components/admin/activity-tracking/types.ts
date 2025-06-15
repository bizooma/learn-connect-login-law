
export interface UserSession {
  id: string;
  user_id: string;
  course_id?: string;
  session_start: string;
  session_end?: string;
  duration_seconds?: number;
  session_type: 'general' | 'course' | 'unit';
  entry_point?: string;
  exit_point?: string;
  user_email?: string;
  course_title?: string;
  metadata?: Record<string, any>;
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
