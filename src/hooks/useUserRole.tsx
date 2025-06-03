
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
      setRole('student'); // Default to student when no user
      setLoading(false);
      return;
    }

    try {
      console.log(`useUserRole: Fetching role for user ${user.id}`);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('useUserRole: Database error:', error);
        // Default to student on error
        setRole('student');
      } else if (data && data.role) {
        console.log('useUserRole: Role fetched successfully:', data.role);
        setRole(data.role);
      } else {
        // No role found - default to student
        console.log('useUserRole: No role found for user, defaulting to student');
        setRole('student');
      }
    } catch (error) {
      console.error('useUserRole: Unexpected error:', error);
      setRole('student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      setLoading(true);
      fetchUserRole();
    }
  };

  // Compute derived values - ensure we always have a role when user exists
  const effectiveRole = user ? (role || 'student') : null;
  const isAdmin = effectiveRole === 'admin';
  const isOwner = effectiveRole === 'owner';
  const isStudent = effectiveRole === 'student';
  const isClient = effectiveRole === 'client';
  const isFree = effectiveRole === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

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
