/**
 * Sanitizes form data for database insertion by converting empty strings to null
 * for optional fields, while preserving required fields as-is
 */
export const sanitizeForDatabase = <T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[] = []
): T => {
  const sanitized = { ...data };
  
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
  
  return sanitized;
};
