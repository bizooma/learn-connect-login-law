
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
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'All fields (email, firstName, lastName, role) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authorization header received:', authHeader ? 'Yes' : 'No');

    // Extract the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with anon key to check requesting user's permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the token and get user info
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed - invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if the requesting user is an admin or owner using admin client
    const { data: userRole, error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('User role check:', { userRole, userRoleError });

    // If no role found, this might be the first user - allow creation of admin/owner users
    if (userRoleError && userRoleError.code === 'PGRST116') {
      console.log('No role found for user - checking if this is the first user');
      
      // Check if there are any admin or owner users in the system
      const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'owner'])
        .limit(1);

      if (adminCheckError) {
        console.error('Error checking for existing admins:', adminCheckError);
        return new Response(
          JSON.stringify({ error: 'Database error checking admin users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If no admins exist, allow creation of admin/owner users
      if (!existingAdmins || existingAdmins.length === 0) {
        console.log('No admin users exist - allowing creation of first admin/owner user');
      } else {
        console.error('Permission denied - user has no role but admins exist');
        return new Response(
          JSON.stringify({ error: 'Admin or owner privileges required to create users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
      console.error('Permission denied for user:', user.id, 'role:', userRole?.role);
      return new Response(
        JSON.stringify({ error: 'Admin or owner privileges required to create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized to create users, proceeding...');

    // Generate a secure temporary password
    const tempPassword = `TempPass${Math.random().toString(36).slice(-8)}!${Math.floor(Math.random() * 100)}`;

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
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      console.error('User creation failed - no user data returned');
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    const { error: assignRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role
      });

    if (assignRoleError) {
      console.error('Role assignment error:', assignRoleError);
      // Don't throw here as the user was created
    } else {
      console.log('Role assigned successfully:', role);
    }

    console.log('User created successfully:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} has been created successfully with role ${role}`,
        userId: authData.user.id,
        tempPassword: tempPassword
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
