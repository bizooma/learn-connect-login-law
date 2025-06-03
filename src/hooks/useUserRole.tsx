
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user?.id) {
      console.log('useUserRole: No user ID available');
      setRole('student'); // Default fallback
      setLoading(false);
      return;
    }

    try {
      console.log(`useUserRole: Fetching role for user ${user.id}`);
      
      // Create a promise that times out after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 5000);
      });

      // Race the query against the timeout
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('useUserRole: Query result:', { 
        data, 
        error, 
        userId: user.id
      });

      if (error) {
        console.error('useUserRole: Database error:', error);
        setRole('student'); // Default fallback on error
        setLoading(false);
        return;
      }

      if (data?.role) {
        console.log('useUserRole: Role fetched successfully:', data.role);
        setRole(data.role);
      } else {
        console.log('useUserRole: No role found for user - defaulting to student');
        setRole('student');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('useUserRole: Unexpected error or timeout:', error);
      setRole('student'); // Final fallback
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      console.log('useUserRole: User changed, fetching role for:', user.id);
      setLoading(true);
      setRole(null); // Clear previous role
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, setting default state');
      setRole('student');
      setLoading(false);
    }
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      setLoading(true);
      setRole(null); // Clear current role
      fetchUserRole();
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
