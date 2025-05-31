import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface ImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  updatedUsers: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Batch import request received');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user authentication and permissions
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
      console.error('Insufficient privileges for user:', user.email);
      throw new Error('Insufficient privileges');
    }

    // Parse request body
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const updateExisting = formData.get('updateExisting') === 'true';
    const filename = file?.name || 'unknown.csv';

    if (!file) {
      throw new Error('No file provided');
    }

    const csvData = await file.text();
    console.log(`Processing CSV file: ${filename}, ${csvData.length} characters, updateExisting: ${updateExisting}`);
    
    // Parse CSV data
    const users = parseCSV(csvData);
    console.log(`Parsed ${users.length} users from CSV`);

    // Initialize stats
    const stats: ImportResult = {
      totalRows: users.length,
      successfulImports: 0,
      failedImports: 0,
      duplicateEmails: 0,
      updatedUsers: 0,
      errors: []
    };

    // Process users in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
      
      await processBatch(supabaseAdmin, batch, i, stats, updateExisting);
    }

    // Log the import batch
    try {
      await supabaseAdmin
        .from('user_import_batches')
        .insert({
          filename,
          total_rows: stats.totalRows,
          successful_imports: stats.successfulImports,
          failed_imports: stats.failedImports,
          duplicate_emails: stats.duplicateEmails,
          import_errors: stats.errors,
          imported_by: user.id
        });
    } catch (batchLogError) {
      console.error('Error logging import batch:', batchLogError);
    }

    console.log('Batch import completed with stats:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: updateExisting 
          ? `Import completed: ${stats.successfulImports} new, ${stats.updatedUsers} updated, ${stats.failedImports} failed`
          : `Import completed: ${stats.successfulImports} successful, ${stats.failedImports} failed`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Batch import failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processBatch(
  supabase: any,
  batch: UserData[],
  startIndex: number,
  stats: ImportResult,
  updateExisting: boolean
) {
  // Check for existing profiles
  const emails = batch.map(user => user.email);
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', emails);

  const existingEmailMap = new Map(existingProfiles?.map((p: any) => [p.email, p.id]) || []);

  const newUsers: UserData[] = [];
  const usersToUpdate: Array<{ userData: UserData; profileId: string }> = [];
  
  // Separate new users from existing ones
  batch.forEach((user, index) => {
    const profileId = existingEmailMap.get(user.email);
    
    if (profileId) {
      if (updateExisting) {
        usersToUpdate.push({ userData: user, profileId });
      } else {
        stats.failedImports++;
        stats.duplicateEmails++;
        stats.errors.push({
          row: startIndex + index + 1,
          email: user.email,
          error: 'Email already exists'
        });
      }
    } else {
      newUsers.push(user);
    }
  });

  // Handle updates for existing users
  if (usersToUpdate.length > 0) {
    try {
      // Update profiles
      for (const { userData, profileId } of usersToUpdate) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: userData.first_name,
            last_name: userData.last_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);

        if (profileError) {
          console.error('Profile update error:', profileError);
          stats.failedImports++;
          const rowIndex = batch.findIndex(u => u.email === userData.email) + startIndex + 1;
          stats.errors.push({
            row: rowIndex,
            email: userData.email,
            error: `Profile update failed: ${profileError.message}`
          });
          continue;
        }

        // Update or insert user role
        const normalizedRole = normalizeRole(userData.role);
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: profileId,
            role: normalizedRole
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) {
          console.error('Role update error:', roleError);
          // Don't fail the entire operation if role update fails
        }

        stats.updatedUsers++;
      }
    } catch (error) {
      console.error('Batch update error:', error);
    }
  }

  // Handle new users (existing logic)
  if (newUsers.length > 0) {
    try {
      // Create auth users in batch
      const authResults = await Promise.allSettled(
        newUsers.map(user => createAuthUser(supabase, user))
      );

      const successfulAuthUsers: Array<{ user: UserData; authId: string }> = [];

      authResults.forEach((result, index) => {
        const user = newUsers[index];
        const rowIndex = batch.indexOf(user) + startIndex + 1;

        if (result.status === 'fulfilled' && result.value.success) {
          successfulAuthUsers.push({
            user,
            authId: result.value.authId
          });
        } else {
          stats.failedImports++;
          const error = result.status === 'rejected' 
            ? result.reason.message 
            : result.value.error;
          stats.errors.push({
            row: rowIndex,
            email: user.email,
            error: `Auth creation failed: ${error}`
          });
        }
      });

      if (successfulAuthUsers.length > 0) {
        // Batch insert profiles
        const profilesData = successfulAuthUsers.map(({ user, authId }) => ({
          id: authId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }));

        const { error: profilesError } = await supabase
          .from('profiles')
          .insert(profilesData);

        if (profilesError) {
          console.error('Profiles batch insert error:', profilesError);
          // Mark all as failed if profiles insert fails
          successfulAuthUsers.forEach(({ user }) => {
            stats.failedImports++;
            const rowIndex = batch.indexOf(user) + startIndex + 1;
            stats.errors.push({
              row: rowIndex,
              email: user.email,
              error: `Profile creation failed: ${profilesError.message}`
            });
          });
          return;
        }

        // Batch insert user roles
        const rolesData = successfulAuthUsers.map(({ user, authId }) => ({
          user_id: authId,
          role: normalizeRole(user.role)
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(rolesData);

        if (rolesError) {
          console.error('Roles batch insert error:', rolesError);
          // Don't fail the entire operation if role assignment fails
        }

        // Mark successful imports
        stats.successfulImports += successfulAuthUsers.length;
        console.log(`Successfully processed ${successfulAuthUsers.length} new users in batch`);
      }

    } catch (error) {
      console.error('Batch processing error:', error);
      newUsers.forEach((user, index) => {
        stats.failedImports++;
        const rowIndex = batch.indexOf(user) + startIndex + 1;
        stats.errors.push({
          row: rowIndex,
          email: user.email,
          error: `Batch processing failed: ${error.message}`
        });
      });
    }
  }
}

async function createAuthUser(supabase: any, userData: UserData) {
  try {
    const password = generateRandomPassword();
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) {
      return {
        success: false,
        error: authError.message
      };
    }

    return {
      success: true,
      authId: authData.user.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function parseCSV(csvContent: string): UserData[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const dataLines = lines.slice(1); // Skip header
  const users: UserData[] = [];
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    
    if (fields.length < 4) continue;
    
    const [role, firstName, lastName, email] = fields;
    
    if (!email || !email.trim()) continue;
    
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) continue;
    
    users.push({
      email: cleanEmail,
      first_name: firstName?.trim() || '',
      last_name: lastName?.trim() || '',
      role: role?.trim() || 'student'
    });
  }
  
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
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  fields.push(current.trim());
  
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

function normalizeRole(role: string): string {
  if (!role || typeof role !== 'string') {
    return 'student';
  }
  
  const normalizedRole = role.toLowerCase().trim();
  
  const roleMap: Record<string, string> = {
    'admin': 'admin',
    'administrator': 'admin',
    'owner': 'admin',
    'student': 'student',
    'user': 'student',
    'member': 'student'
  };
  
  return roleMap[normalizedRole] || 'student';
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
