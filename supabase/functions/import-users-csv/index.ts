
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
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
      throw new Error('Insufficient privileges');
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = file?.name || 'unknown.csv';

    if (!file) {
      throw new Error('No file provided');
    }

    // Read and parse CSV
    const csvText = await file.text();
    console.log(`Processing CSV file: ${filename}`);
    console.log(`CSV content length: ${csvText.length}`);
    
    const users = parseCSV(csvText);
    console.log(`Parsed ${users.length} users from CSV`);

    // Initialize stats
    const stats: ImportStats = {
      totalRows: users.length,
      successfulImports: 0,
      failedImports: 0,
      duplicateEmails: 0,
      errors: []
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Processing user ${i + 1}/${users.length}: ${user.email}`);
      
      try {
        const result = await createUser(supabaseAdmin, user);
        
        if (result.success) {
          stats.successfulImports++;
          console.log(`✓ Successfully created user: ${user.email}`);
        } else {
          stats.failedImports++;
          if (result.isDuplicate) {
            stats.duplicateEmails++;
          }
          stats.errors.push({
            row: i + 1,
            email: user.email,
            error: result.error || 'Unknown error'
          });
          console.log(`✗ Failed to create user ${user.email}: ${result.error}`);
        }
      } catch (error) {
        stats.failedImports++;
        stats.errors.push({
          row: i + 1,
          email: user.email,
          error: `Unexpected error: ${error.message}`
        });
        console.error(`✗ Unexpected error for user ${user.email}:`, error);
      }
    }

    // Log the import batch
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
    }

    console.log('Import completed:', stats);

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
    console.error('Import failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
