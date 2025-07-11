
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export function validateCreateUserRequest(body: any): { isValid: boolean; error?: string; data?: CreateUserRequest } {
  const { email, firstName, lastName, password } = body;

  if (!email || !firstName || !lastName) {
    return {
      isValid: false,
      error: 'All fields (email, firstName, lastName) are required'
    };
  }

  if (password && password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long'
    };
  }

  return {
    isValid: true,
    data: { email, firstName, lastName, password }
  };
}
