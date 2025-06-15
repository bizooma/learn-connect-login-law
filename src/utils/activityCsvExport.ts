
import type { UserSession, SessionStats, CSVExportOptions } from "@/components/admin/activity-tracking/types";

export const generateSessionsCSV = (sessions: UserSession[]): string => {
  const headers = [
    'User Email',
    'Session Type',
    'Course Title',
    'Start Time',
    'End Time',
    'Duration (seconds)',
    'Duration (formatted)',
    'Entry Point',
    'Exit Point',
    'Session Date',
    'Session ID'
  ];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const rows = sessions.map(session => [
    session.user_email || '',
    session.session_type,
    session.course_title || '',
    new Date(session.session_start).toISOString(),
    session.session_end ? new Date(session.session_end).toISOString() : '',
    session.duration_seconds?.toString() || '',
    formatDuration(session.duration_seconds),
    session.entry_point || '',
    session.exit_point || '',
    new Date(session.session_start).toISOString().split('T')[0],
    session.id
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

export const generateStatsCSV = (stats: SessionStats[]): string => {
  const headers = [
    'User Email',
    'Total Sessions',
    'Total Time (seconds)',
    'Total Time (hours)',
    'Average Session Duration (minutes)',
    'Course Sessions',
    'General Sessions',
    'Last Activity'
  ];

  const rows = stats.map(stat => [
    stat.user_email,
    stat.total_sessions.toString(),
    stat.total_time_seconds.toString(),
    (stat.total_time_seconds / 3600).toFixed(1),
    (stat.avg_session_duration / 60).toFixed(1),
    stat.course_sessions.toString(),
    stat.general_sessions.toString(),
    new Date(stat.last_activity).toISOString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
};

export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportSessionsToCSV = (
  sessions: UserSession[], 
  filters: CSVExportOptions['filters']
): void => {
  const csv = generateSessionsCSV(sessions);
  const date = new Date().toISOString().split('T')[0];
  const filename = `user-sessions-${date}.csv`;
  downloadCSV(csv, filename);
};

export const exportStatsToCSV = (
  stats: SessionStats[], 
  filters: CSVExportOptions['filters']
): void => {
  const csv = generateStatsCSV(stats);
  const date = new Date().toISOString().split('T')[0];
  const filename = `session-statistics-${date}.csv`;
  downloadCSV(csv, filename);
};
