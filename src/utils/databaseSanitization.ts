
/**
 * Sanitizes form data for database insertion by converting empty strings to null
 * for optional fields, while preserving required fields as-is
 */
export const sanitizeForDatabase = <T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[] = []
): T => {
  const sanitized = { ...data } as Record<string, any>;
  
  for (const [key, value] of Object.entries(sanitized)) {
    // If it's a required field, keep the value as-is (even if empty string)
    if (requiredFields.includes(key)) {
      continue;
    }
    
    // For optional fields, convert empty strings to null
    if (value === '' || value === undefined) {
      sanitized[key] = null;
    }
  }
  
  return sanitized as T;
};

/**
 * Sanitizes course data specifically, ensuring required fields have defaults
 */
export const sanitizeCourseData = (data: any) => {
  const sanitized = { ...data };
  
  // Ensure level has a default if empty
  if (!sanitized.level || sanitized.level.trim() === '') {
    sanitized.level = 'Sales-100'; // Default level
  }
  
  // Ensure category has a default if empty
  if (!sanitized.category || sanitized.category.trim() === '') {
    sanitized.category = 'General'; // Default category
  }
  
  // Ensure instructor has a default if empty
  if (!sanitized.instructor || sanitized.instructor.trim() === '') {
    sanitized.instructor = 'New Frontier University'; // Default instructor
  }
  
  return sanitized;
};
