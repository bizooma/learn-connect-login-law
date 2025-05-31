
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CSVRow {
  role: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  duplicateEmails: number;
  errors: Array<{ row: number; email: string; error: string }>;
  batchId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and has admin privileges
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin or owner role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const hasAdminAccess = userRoles?.some(r => ['admin', 'owner'].includes(r.role))
    if (!hasAdminAccess) {
      throw new Error('Insufficient permissions')
    }

    const { csvData, filename } = await req.json()

    console.log(`Processing CSV import: ${filename}`)

    // Parse CSV data
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map((h: string) => h.trim())
    
    // Validate headers
    const expectedHeaders = ['role', 'First Name', 'Last Name', 'email address']
    if (headers.length !== 4) {
      throw new Error('CSV must have exactly 4 columns: role, First Name, Last Name, email address')
    }

    const rows: CSVRow[] = []
    const errors: Array<{ row: number; email: string; error: string }> = []

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Split and pad with empty strings if needed
      const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''))
      
      // Ensure we have exactly 4 values, padding with empty strings if necessary
      while (values.length < 4) {
        values.push('')
      }

      // If there are more than 4 columns, take only the first 4
      const [role, firstName, lastName, email] = values.slice(0, 4)

      // Validate required fields - email is mandatory
      if (!email || email.trim() === '') {
        errors.push({
          row: i + 1,
          email: email || 'empty',
          error: 'Email address is required'
        })
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push({
          row: i + 1,
          email,
          error: 'Invalid email format'
        })
        continue
      }

      // Validate role - default to 'student' if empty
      let validatedRole = role.toLowerCase().trim()
      if (!validatedRole) {
        validatedRole = 'student' // Default role for empty cells
      }

      const validRoles = ['admin', 'owner', 'student', 'client', 'free']
      if (!validRoles.includes(validatedRole)) {
        errors.push({
          row: i + 1,
          email,
          error: `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')} or leave empty for default 'student'`
        })
        continue
      }

      rows.push({
        role: validatedRole,
        firstName: firstName.trim() || '', // Allow empty first name
        lastName: lastName.trim() || '',   // Allow empty last name
        email: email.toLowerCase().trim()
      })
    }

    console.log(`Parsed ${rows.length} valid rows with ${errors.length} errors`)

    // Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('user_import_batches')
      .insert({
        imported_by: user.id,
        filename,
        total_rows: lines.length - 1, // Exclude header
        import_errors: errors
      })
      .select()
      .single()

    if (batchError) {
      throw new Error(`Failed to create import batch: ${batchError.message}`)
    }

    let successfulImports = 0
    let duplicateEmails = 0

    // Process valid rows
    for (const row of rows) {
      try {
        // Check if email already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.email)
          .single()

        if (existingProfile) {
          duplicateEmails++
          errors.push({
            row: 0, // We've lost track of the original row number here
            email: row.email,
            error: 'Email already exists'
          })
          continue
        }

        // Create auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: row.email,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            first_name: row.firstName || null,
            last_name: row.lastName || null
          }
        })

        if (authError) {
          console.error('Auth user creation error:', authError)
          errors.push({
            row: 0,
            email: row.email,
            error: `Failed to create auth user: ${authError.message}`
          })
          continue
        }

        if (!authUser.user) {
          errors.push({
            row: 0,
            email: row.email,
            error: 'Failed to create auth user: No user returned'
          })
          continue
        }

        // The profile should be created automatically by the trigger
        // But let's make sure it exists and update it if needed
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.user.id)
          .single()

        if (!profile) {
          // If profile wasn't created by trigger, create it manually
          const { error: manualProfileError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.user.id,
              email: row.email,
              first_name: row.firstName || null,
              last_name: row.lastName || null
            })

          if (manualProfileError) {
            console.error('Manual profile creation error:', manualProfileError)
            errors.push({
              row: 0,
              email: row.email,
              error: `Failed to create profile: ${manualProfileError.message}`
            })
            continue
          }
        }

        // Insert role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: row.role
          })

        if (roleError) {
          console.error('Role assignment error:', roleError)
          errors.push({
            row: 0,
            email: row.email,
            error: `Failed to assign role: ${roleError.message}`
          })
          continue
        }

        successfulImports++
        console.log(`Successfully imported user: ${row.email}`)
      } catch (error) {
        console.error('Unexpected error for user:', row.email, error)
        errors.push({
          row: 0,
          email: row.email,
          error: `Unexpected error: ${error.message}`
        })
      }
    }

    // Update batch with final results
    await supabase
      .from('user_import_batches')
      .update({
        successful_imports: successfulImports,
        failed_imports: errors.length,
        duplicate_emails: duplicateEmails,
        import_errors: errors
      })
      .eq('id', batch.id)

    const result: ImportResult = {
      success: true,
      totalRows: lines.length - 1,
      successfulImports,
      failedImports: errors.length,
      duplicateEmails,
      errors,
      batchId: batch.id
    }

    console.log(`Import completed: ${successfulImports} successful, ${errors.length} failed`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
