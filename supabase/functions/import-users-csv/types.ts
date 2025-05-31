
export interface CSVRow {
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
  batchId: string;
}

export interface ImportError {
  row: number;
  email: string;
  error: string;
}
