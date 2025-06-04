
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function checkUserPermissions(userId: string) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check if the requesting user is an admin or owner
  const { data: userRole, error: userRoleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  console.log('User role check:', { userRole, userRoleError });

  // If no role found, this might be the first user - allow creation
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

    // If no admins exist, allow creation
    if (!existingAdmins || existingAdmins.length === 0) {
      console.log('No admin users exist - allowing creation of first user');
      return { allowed: true };
    } else {
      console.error('Permission denied - user has no role but admins exist');
      return {
        allowed: false,
        error: 'Admin or owner privileges required to create users',
        status: 403
      };
    }
  } else if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'owner')) {
    console.error('Permission denied for user:', userId, 'role:', userRole?.role);
    return {
      allowed: false,
      error: 'Admin or owner privileges required to create users',
      status: 403
    };
  }

  return { allowed: true };
}
