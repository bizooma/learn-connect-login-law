import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Direct admin emails that bypass normal role checks
const DIRECT_ADMIN_EMAILS = [
  'joe@bizooma.com',
  'admin@newfrontieruniversity.com',
  'erin.walsh@newfrontier.us',
  'carolina@newfrontieruniversity.com'
];

export async function isDirectAdmin(email: string): Promise<boolean> {
  return DIRECT_ADMIN_EMAILS.includes(email);
}

export async function validateAdminPermissions(userId: string, userEmail: string) {
  console.log('Validating admin permissions for:', { userId, userEmail });
  
  // First check if user is in direct admin bypass list
  if (await isDirectAdmin(userEmail)) {
    console.log('User is in direct admin bypass list');
    return { allowed: true, reason: 'direct_admin_bypass' };
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check database roles
  const { data: userRole, error: userRoleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  console.log('Database role check:', { userRole, userRoleError });

  // If no role found, check if this might be the first user
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
      return {
        allowed: false,
        error: 'Database error checking admin users',
        status: 500
      };
    }

    // If no admins exist, allow creation (first user scenario)
    if (!existingAdmins || existingAdmins.length === 0) {
      console.log('No admin users exist - allowing first user creation');
      return { allowed: true, reason: 'first_user' };
    } else {
      console.error('Permission denied - user has no role but admins exist');
      return {
        allowed: false,
        error: 'Admin or owner privileges required',
        status: 403
      };
    }
  } else if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
    console.error('Permission denied for user:', userId, 'role:', userRole?.role);
    return {
      allowed: false,
      error: 'Admin or owner privileges required',
      status: 403
    };
  }

  console.log('User has valid admin/owner role:', userRole.role);
  return { allowed: true, reason: 'database_role', role: userRole.role };
}