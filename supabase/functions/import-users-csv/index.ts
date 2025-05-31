
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseCSV } from './csvParser.ts';
import { createUser } from './userCreator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportStats {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Import request received');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role
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

    // Verify the user making the request is authenticated and has admin privileges
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.email);

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

    console.log('User has required permissions');

    // Parse request body to get CSV data
    const contentType = req.headers.get('content-type') || '';
    let csvData = '';
    let filename = 'unknown.csv';

    if (contentType.includes('multipart/form-data')) {
      console.log('Processing FormData');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      filename = file?.name || 'unknown.csv';

      if (!file) {
        throw new Error('No file provided');
      }

      csvData = await file.text();
    } else {
      console.log('Processing JSON payload');
      const body = await req.json();
      csvData = body.csvData;
      filename = body.filename || 'unknown.csv';
    }

    if (!csvData) {
      throw new Error('No CSV data provided');
    }

    console.log(`Processing CSV file: ${filename}`);
    console.log(`CSV content length: ${csvData.length} characters`);
    
    // Parse CSV with error handling
    let users;
    try {
      users = parseCSV(csvData);
      console.log(`Successfully parsed ${users.length} users from CSV`);
    } catch (parseError) {
      console.error('CSV parsing failed:', parseError);
      throw new Error(`CSV parsing failed: ${parseError.message}`);
    }

    // Initialize stats
    const stats: ImportStats = {
      totalRows: users.length,
      successfulImports: 0,
      failedImports: 0,
      duplicateEmails: 0,
      errors: []
    };

    console.log(`Starting to process ${users.length} users`);

    // Process each user with timeout and error handling
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      console.log(`Processing user ${i + 1}/${users.length}: ${userData.email}`);
      
      try {
        // Add timeout to prevent hanging
        const createUserPromise = createUser(supabaseAdmin, userData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User creation timeout')), 30000)
        );
        
        const result = await Promise.race([createUserPromise, timeoutPromise]) as any;
        
        if (result.success) {
          stats.successfulImports++;
          console.log(`✓ Successfully created user: ${userData.email}`);
        } else {
          stats.failedImports++;
          if (result.isDuplicate) {
            stats.duplicateEmails++;
          }
          stats.errors.push({
            row: i + 1,
            email: userData.email,
            error: result.error || 'Unknown error'
          });
          console.log(`✗ Failed to create user ${userData.email}: ${result.error}`);
        }
      } catch (error) {
        stats.failedImports++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push({
          row: i + 1,
          email: userData.email,
          error: `Unexpected error: ${errorMessage}`
        });
        console.error(`✗ Unexpected error for user ${userData.email}:`, error);
      }

      // Log progress every 10 users
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${users.length} users processed`);
      }
    }

    // Log the import batch
    try {
      const { error: batchError } = await supabaseAdmin
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

      if (batchError) {
        console.error('Failed to log import batch:', batchError);
      } else {
        console.log('Import batch logged successfully');
      }
    } catch (batchLogError) {
      console.error('Error logging import batch:', batchLogError);
    }

    console.log('Import completed with stats:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        message: `Import completed: ${stats.successfulImports} successful, ${stats.failedImports} failed`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Import failed with error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
