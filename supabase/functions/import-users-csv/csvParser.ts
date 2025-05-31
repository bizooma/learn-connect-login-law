
interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export function parseCSV(csvContent: string): UserData[] {
  console.log('Starting CSV parsing...');
  
  const lines = csvContent.trim().split('\n');
  console.log(`Found ${lines.length} lines in CSV`);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header row if it exists
  const dataLines = lines.slice(1);
  console.log(`Processing ${dataLines.length} data rows`);
  
  const users: UserData[] = [];
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue; // Skip empty lines
    
    console.log(`Processing line ${i + 1}: ${line}`);
    
    // Parse CSV line - handle quoted fields
    const fields = parseCSVLine(line);
    
    if (fields.length < 4) {
      console.warn(`Line ${i + 1} has insufficient columns: ${fields.length}, skipping`);
      continue;
    }
    
    const [role, firstName, lastName, email] = fields;
    
    // Email is required
    if (!email || !email.trim()) {
      console.warn(`Line ${i + 1} missing email, skipping`);
      continue;
    }
    
    // Clean and validate email
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      console.warn(`Line ${i + 1} has invalid email: ${cleanEmail}, skipping`);
      continue;
    }
    
    users.push({
      email: cleanEmail,
      first_name: firstName?.trim() || '',
      last_name: lastName?.trim() || '',
      role: role?.trim() || 'student'
    });
    
    console.log(`Added user: ${cleanEmail} with role: ${role?.trim() || 'student'}`);
  }
  
  console.log(`Successfully parsed ${users.length} users from CSV`);
  return users;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      fields.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  fields.push(current.trim());
  
  // Clean up quotes from fields
  return fields.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
