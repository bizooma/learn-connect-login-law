
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function validateUserPermissions(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<{ user: any; error?: string }> {
  if (!authHeader) {
    return { user: null, error: 'No authorization header' };
  }

  // Verify the user is authenticated and has admin privileges
  const { data: { user }, error: userError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  // Check if user has admin or owner role
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const hasAdminAccess = userRoles?.some(r => ['admin', 'owner'].includes(r.role));
  if (!hasAdminAccess) {
    return { user: null, error: 'Insufficient permissions' };
  }

  return { user };
}
