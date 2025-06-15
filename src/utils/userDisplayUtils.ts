
/**
 * Utility functions for formatting user display names with job titles
 */

interface UserWithJobTitle {
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
}

/**
 * Formats a user's display name, optionally including their job title
 * @param user - User object with first_name, last_name, and optional job_title
 * @param includeJobTitle - Whether to include the job title in the display
 * @returns Formatted display name
 */
export const formatUserDisplayName = (
  user: UserWithJobTitle,
  includeJobTitle: boolean = true
): string => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  
  if (!fullName) {
    return 'Unknown User';
  }
  
  if (includeJobTitle && user.job_title) {
    return `${fullName}, ${user.job_title}`;
  }
  
  return fullName;
};

/**
 * Gets just the job title for display purposes
 * @param user - User object with job_title
 * @returns Job title or empty string
 */
export const getUserJobTitle = (user: UserWithJobTitle): string => {
  return user.job_title || '';
};
