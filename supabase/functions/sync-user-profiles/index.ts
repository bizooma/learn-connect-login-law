
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
  created_at?: string;
}

interface AuthUsersResponse {
  users: AuthUser[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Sync user profiles request received');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role for admin operations
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

    console.log('User has required permissions, starting profile sync...');

    // Get all auth users using service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError || !authData?.users) {
      console.error('Failed to fetch auth users:', authError);
      throw new Error('Failed to fetch auth users');
    }

    console.log(`Found ${authData.users.length} auth users`);

    // Get existing profile IDs
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Failed to fetch existing profiles:', profilesError);
      throw profilesError;
    }

    const existingProfileIds = new Set(
      (existingProfiles || []).map(p => p.id)
    );

    console.log(`Found ${existingProfileIds.size} existing profiles`);

    // Find users without profiles
    const usersWithoutProfiles = authData.users.filter((authUser: AuthUser) => 
      !existingProfileIds.has(authUser.id)
    );

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All users already have profiles',
          createdCount: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create missing profiles
    const profilesToCreate = usersWithoutProfiles.map((authUser: AuthUser) => ({
      id: authUser.id,
      email: authUser.email || '',
      first_name: authUser.user_metadata?.first_name || '',
      last_name: authUser.user_metadata?.last_name || '',
      created_at: authUser.created_at || new Date().toISOString()
    }));

    console.log(`Creating ${profilesToCreate.length} profiles...`);

    const { data: insertedProfiles, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilesToCreate)
      .select('id');

    if (insertError) {
      console.error('Failed to insert profiles:', insertError);
      throw insertError;
    }

    const createdCount = insertedProfiles?.length || 0;
    console.log(`Successfully created ${createdCount} profiles`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${createdCount} missing profiles`,
        createdCount,
        details: {
          totalAuthUsers: authData.users.length,
          existingProfiles: existingProfileIds.size,
          usersWithoutProfiles: usersWithoutProfiles.length,
          profilesCreated: createdCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Profile sync failed:', error);
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
