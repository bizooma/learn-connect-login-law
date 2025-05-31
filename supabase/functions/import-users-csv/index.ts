
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
    console.log('Starting user import process');
    
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
      console.error('Authorization failed:', authError);
      throw new Error(authError || 'Unauthorized');
    }

    console.log(`Import initiated by user: ${user.id}`);

    const { csvData, filename } = await req.json();
    console.log(`Processing CSV import: ${filename}`);

    if (!csvData) {
      throw new Error('No CSV data provided');
    }

    // Parse CSV data
    const { rows, errors } = parseCSVData(csvData);
    console.log(`Parsed ${rows.length} valid rows with ${errors.length} parsing errors`);

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
      console.error('Failed to create import batch:', batchError);
      throw new Error(`Failed to create import batch: ${batchError.message}`);
    }

    console.log(`Created import batch: ${batch.id}`);

    let successfulImports = 0;
    let duplicateEmails = 0;
    const allErrors: ImportError[] = [...errors];

    // Process valid rows with better error tracking
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Processing user ${i + 1}/${rows.length}: ${row.email}`);
      
      const result = await createUser(supabase, row);
      
      if (result.success) {
        successfulImports++;
        console.log(`✓ Successfully imported: ${row.email} (${successfulImports}/${rows.length})`);
      } else {
        console.log(`✗ Failed to import: ${row.email} - ${result.error}`);
        
        if (result.error === 'Email already exists') {
          duplicateEmails++;
        }
        
        // Try to find the original row number
        const originalRowNumber = i + 2; // +1 for 0-based index, +1 for header row
        
        allErrors.push({
          row: originalRowNumber,
          email: row.email,
          error: result.error || 'Unknown error'
        });
      }
    }

    // Update batch with final results
    const { error: updateError } = await supabase
      .from('user_import_batches')
      .update({
        successful_imports: successfulImports,
        failed_imports: allErrors.length - errors.length, // Exclude parsing errors
        duplicate_emails: duplicateEmails,
        import_errors: allErrors
      })
      .eq('id', batch.id);

    if (updateError) {
      console.error('Failed to update batch results:', updateError);
    }

    const result: ImportResult = {
      success: true,
      totalRows: csvData.trim().split('\n').length - 1,
      successfulImports,
      failedImports: allErrors.length - errors.length,
      duplicateEmails,
      errors: allErrors,
      batchId: batch.id
    };

    console.log(`Import completed: ${successfulImports} successful, ${allErrors.length - errors.length} failed, ${duplicateEmails} duplicates`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        duplicateEmails: 0,
        errors: [],
        batchId: ''
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
