
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export function validateCreateUserRequest(body: any): { isValid: boolean; error?: string; data?: CreateUserRequest } {
  const { email, firstName, lastName } = body;

  if (!email || !firstName || !lastName) {
    return {
      isValid: false,
      error: 'All fields (email, firstName, lastName) are required'
    };
  }

  return {
    isValid: true,
    data: { email, firstName, lastName }
  };
}
