
import { CSVRow, ImportError } from './types.ts';

export function parseCSVData(csvData: string): { rows: CSVRow[]; errors: ImportError[] } {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());
  
  // Validate headers
  if (headers.length !== 4) {
    throw new Error('CSV must have exactly 4 columns: role, First Name, Last Name, email address');
  }

  const rows: CSVRow[] = [];
  const errors: ImportError[] = [];

  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split and pad with empty strings if needed
    const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
    
    // Ensure we have exactly 4 values, padding with empty strings if necessary
    while (values.length < 4) {
      values.push('');
    }

    // If there are more than 4 columns, take only the first 4
    const [role, firstName, lastName, email] = values.slice(0, 4);

    // Validate required fields - email is mandatory
    if (!email || email.trim() === '') {
      errors.push({
        row: i + 1,
        email: email || 'empty',
        error: 'Email address is required'
      });
      continue;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        row: i + 1,
        email,
        error: 'Invalid email format'
      });
      continue;
    }

    // Validate role - default to 'student' if empty
    let validatedRole = role.toLowerCase().trim();
    if (!validatedRole) {
      validatedRole = 'student'; // Default role for empty cells
    }

    const validRoles = ['admin', 'owner', 'student', 'client', 'free'];
    if (!validRoles.includes(validatedRole)) {
      errors.push({
        row: i + 1,
        email,
        error: `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')} or leave empty for default 'student'`
      });
      continue;
    }

    rows.push({
      role: validatedRole,
      firstName: firstName.trim() || '', // Allow empty first name
      lastName: lastName.trim() || '',   // Allow empty last name
      email: email.toLowerCase().trim()
    });
  }

  return { rows, errors };
}
