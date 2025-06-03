
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Create single user request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { email, firstName, lastName, role } = await req.json();

    console.log('Creating user:', { email, firstName, lastName, role });

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      throw new Error('All fields (email, firstName, lastName, role) are required');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create Supabase client with anon key to check requesting user's permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Check if the requesting user is authenticated and has admin privileges
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication required');
    }

    console.log('Authenticated user:', user.id);

    // Check if the requesting user is an admin or owner
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('User role check:', { userRole, roleError });

    if (roleError || !userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
      console.error('Permission denied for user:', user.id, 'role:', userRole?.role);
      throw new Error('Admin privileges required');
    }

    console.log('Admin user verified, proceeding with user creation');

    // Generate a temporary password
    const tempPassword = `temp${Math.random().toString(36).slice(-8)}!A1`;

    // Create user in auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    console.log('Auth user created successfully:', authData.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't throw here as the user was created, just log the error
    } else {
      console.log('Profile created successfully');
    }

    // Set user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Don't throw here as the user was created
    } else {
      console.log('Role assigned successfully:', role);
    }

    console.log('User created successfully:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} has been created successfully`,
        userId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
