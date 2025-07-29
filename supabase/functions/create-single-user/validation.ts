
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export function validateCreateUserRequest(body: any): { isValid: boolean; error?: string; data?: CreateUserRequest } {
  const { email, firstName, lastName, password } = body;

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
  const nameRegex = /^[a-zA-Z\s'-]+$/;
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

  // Password validation
  if (password) {
    if (typeof password !== 'string') {
      return {
        isValid: false,
        error: 'Password must be a string'
      };
    }
    
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        error: 'Password exceeds maximum length'
      };
    }
  }

  return {
    isValid: true,
    data: { 
      email: email.trim().toLowerCase(), 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      password 
    }
  };
}
