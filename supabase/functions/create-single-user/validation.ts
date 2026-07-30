
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export function validateCreateUserRequest(body: any): { isValid: boolean; error?: string; data?: CreateUserRequest } {
  const { email, firstName, lastName } = body;

  // Input sanitization and validation
  if (!email || typeof email !== 'string' || !firstName || typeof firstName !== 'string' || !lastName || typeof lastName !== 'string') {
    return {
      isValid: false,
      error: 'All fields (email, firstName, lastName) are required and must be strings'
    };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  // Name validation (prevent XSS)
  const nameRegex = /^[\p{L}\s'’\-]+$/u;
  if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
    return {
      isValid: false,
      error: 'Names can only contain letters, spaces, hyphens, and apostrophes'
    };
  }

  // Length limits
  if (email.length > 254 || firstName.length > 50 || lastName.length > 50) {
    return {
      isValid: false,
      error: 'Field length exceeds maximum allowed'
    };
  }

  return {
    isValid: true,
    data: { 
      email: email.trim().toLowerCase(), 
      firstName: firstName.trim(), 
      lastName: lastName.trim()
    }
  };
}
