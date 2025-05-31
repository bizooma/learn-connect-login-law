
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseCSVData } from './csvParser.ts';
import { createUser } from './userCreator.ts';
import { validateUserPermissions } from './auth.ts';
import { ImportResult, ImportError } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate user permissions
    const { user, error: authError } = await validateUserPermissions(
      supabase,
      req.headers.get('Authorization')
    );

    if (authError || !user) {
      throw new Error(authError || 'Unauthorized');
    }

    const { csvData, filename } = await req.json();
    console.log(`Processing CSV import: ${filename}`);

    // Parse CSV data
    const { rows, errors } = parseCSVData(csvData);
    console.log(`Parsed ${rows.length} valid rows with ${errors.length} errors`);

    // Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('user_import_batches')
      .insert({
        imported_by: user.id,
        filename,
        total_rows: csvData.trim().split('\n').length - 1, // Exclude header
        import_errors: errors
      })
      .select()
      .single();

    if (batchError) {
      throw new Error(`Failed to create import batch: ${batchError.message}`);
    }

    let successfulImports = 0;
    let duplicateEmails = 0;
    const allErrors: ImportError[] = [...errors];

    // Process valid rows
    for (const row of rows) {
      const result = await createUser(supabase, row);
      
      if (result.success) {
        successfulImports++;
      } else {
        if (result.error === 'Email already exists') {
          duplicateEmails++;
        }
        allErrors.push({
          row: 0, // We've lost track of the original row number here
          email: row.email,
          error: result.error || 'Unknown error'
        });
      }
    }

    // Update batch with final results
    await supabase
      .from('user_import_batches')
      .update({
        successful_imports: successfulImports,
        failed_imports: allErrors.length,
        duplicate_emails: duplicateEmails,
        import_errors: allErrors
      })
      .eq('id', batch.id);

    const result: ImportResult = {
      success: true,
      totalRows: csvData.trim().split('\n').length - 1,
      successfulImports,
      failedImports: allErrors.length,
      duplicateEmails,
      errors: allErrors,
      batchId: batch.id
    };

    console.log(`Import completed: ${successfulImports} successful, ${allErrors.length} failed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
