
import { CSVRow, ImportError } from './types.ts';

export function parseCSVData(csvData: string): { rows: CSVRow[]; errors: ImportError[] } {
  const lines = csvData.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
  
  // Validate headers
  if (headers.length < 4) {
    throw new Error('CSV must have at least 4 columns: role, First Name, Last Name, email address');
  }

  console.log(`CSV headers: ${headers.join(', ')}`);
  console.log(`Processing ${lines.length - 1} data rows`);

  const rows: CSVRow[] = [];
  const errors: ImportError[] = [];

  // Process each row (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      console.log(`Skipping empty line ${i + 1}`);
      continue;
    }

    // Split and handle quoted values properly
    const values = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
    
    // Ensure we have at least 4 values, padding with empty strings if necessary
    while (values.length < 4) {
      values.push('');
    }

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
    let validatedRole = role ? role.toLowerCase().trim() : 'student';
    
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
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      email: email.toLowerCase().trim()
    });
  }

  console.log(`Parsed ${rows.length} valid rows with ${errors.length} errors`);
  return { rows, errors };
}
