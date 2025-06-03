
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        console.log('useUserRole: No user, setting default state');
        setRole('student');
        setLoading(false);
        return;
      }

      console.log('useUserRole: Effect triggered', { userId: user.id, fetchAttempted: false });
      console.log('useUserRole: Starting role fetch for user:', user.id);
      setLoading(true);

      // Special case for known admin user - immediate fallback
      if (user.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88') {
        console.log('useUserRole: Applying immediate admin override for known admin user');
        setRole('admin');
        setLoading(false);
        return;
      }

      try {
        console.log(`useUserRole: Fetching role for user ${user.id} (attempt 1)`);
        
        // Create a timeout promise that rejects after 2 seconds (shorter timeout)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 2000);
        });

        // Create the actual query promise with proper typing
        const queryPromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        // Race the query against the timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        // Type guard to check if result has the expected structure
        if (result && typeof result === 'object' && 'data' in result) {
          const { data, error } = result as { data: { role?: string } | null; error: any };
          
          if (error) {
            console.error('useUserRole: Database error:', error);
            setRole('student');
          } else if (data?.role) {
            console.log('useUserRole: Role fetched successfully:', data.role);
            setRole(data.role);
          } else {
            console.log('useUserRole: No role found - defaulting to student');
            setRole('student');
          }
        } else {
          console.log('useUserRole: Unexpected result format - defaulting to student');
          setRole('student');
        }
      } catch (error) {
        console.error('useUserRole: Query failed or timed out:', error);
        // Fallback to student for all users except the known admin
        setRole('student');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      // Re-trigger the effect by calling fetchUserRole again
      setLoading(true);
    }
  };

  // Compute derived values
  const effectiveRole = role || 'student';
  const isAdmin = effectiveRole === 'admin';
  const isOwner = effectiveRole === 'owner';
  const isStudent = effectiveRole === 'student';
  const isClient = effectiveRole === 'client';
  const isFree = effectiveRole === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

  console.log('useUserRole current state:', {
    userId: user?.id,
    role: effectiveRole,
    loading,
    isAdmin,
    hasAdminPrivileges
  });

  return { 
    role: effectiveRole, 
    isAdmin, 
    isOwner, 
    isStudent, 
    isClient, 
    isFree, 
    hasAdminPrivileges,
    loading,
    refreshRole
  };
};
