import { format, formatDistanceToNow } from 'date-fns';

/**
 * Formats a date as a relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Unknown date';
  }
};

/**
 * Formats a date as an absolute date (e.g., "Aug 14, 2025")
 */
export const formatAbsoluteDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    return 'Unknown date';
  }
};

/**
 * Formats a date for user display with both relative and absolute format
 */
export const formatUserJoinDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const relative = formatDistanceToNow(dateObj, { addSuffix: true });
    const absolute = format(dateObj, 'MMM d, yyyy');
    
    // If it's within the last 7 days, show relative, otherwise show absolute
    const daysDiff = Math.abs(Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7 ? relative : absolute;
  } catch (error) {
    return 'Unknown date';
  }
};