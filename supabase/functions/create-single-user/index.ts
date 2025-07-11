
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateCreateUserRequest } from './validation.ts';
import { authenticateRequest } from './auth.ts';
import { checkUserPermissions } from './permissions.ts';
import { createUserAccount } from './userCreation.ts';

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
    // Parse and validate request body
    const body = await req.json();
    const validation = validateCreateUserRequest(body);
    
    if (!validation.isValid) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData = validation.data!;
    console.log('Creating user:', userData);

    // Authenticate the requesting user
    const authResult = await authenticateRequest(req.headers.get('Authorization'));
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', authResult.user!.id);

    // Check permissions
    const permissionResult = await checkUserPermissions(authResult.user!.id, authResult.user!.email || '');
    if (!permissionResult.allowed) {
      return new Response(
        JSON.stringify({ error: permissionResult.error }),
        { status: permissionResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized to create users, proceeding...');

    // Create the user account
    const createResult = await createUserAccount(userData);
    if (!createResult.success) {
      return new Response(
        JSON.stringify({ error: createResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created successfully:', createResult.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${createResult.email} has been created successfully. You can assign a role manually.`,
        userId: createResult.userId,
        tempPassword: createResult.tempPassword
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
