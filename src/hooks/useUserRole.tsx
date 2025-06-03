
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (retryCount = 0, maxRetries = 3) => {
    if (!user?.id) {
      console.log('useUserRole: No user ID available');
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`useUserRole: Fetching role for user ${user.id} (attempt ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no data gracefully

      if (error) {
        console.error('useUserRole: Database error:', error);
        
        // Retry on network or temporary errors
        if (retryCount < maxRetries && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('network') ||
          error.code === 'PGRST301' // Temporary server error
        )) {
          console.log(`useUserRole: Retrying in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => {
            fetchUserRole(retryCount + 1, maxRetries);
          }, (retryCount + 1) * 1000);
          return;
        }
        
        // For permission/auth errors, default to student but log the issue
        if (error.code === 'PGRST116' || error.message.includes('permission')) {
          console.warn('useUserRole: Permission/access error, defaulting to student:', error);
          setRole('student');
        } else {
          console.error('useUserRole: Unhandled error, defaulting to student:', error);
          setRole('student');
        }
      } else if (data?.role) {
        console.log('useUserRole: Role fetched successfully:', data.role);
        setRole(data.role);
      } else {
        // No role found in database
        console.log('useUserRole: No role found for user, defaulting to student');
        setRole('student');
      }
    } catch (error) {
      console.error('useUserRole: Unexpected error:', error);
      
      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        console.log(`useUserRole: Retrying after unexpected error in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchUserRole(retryCount + 1, maxRetries);
        }, (retryCount + 1) * 1000);
        return;
      }
      
      // Final fallback after all retries
      setRole('student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, clearing role');
      setRole(null);
      setLoading(false);
    }
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      fetchUserRole();
    }
  };

  // Compute derived values - ensure we always have a role
  const effectiveRole = role || 'student';
  const isAdmin = effectiveRole === 'admin';
  const isOwner = effectiveRole === 'owner';
  const isStudent = effectiveRole === 'student';
  const isClient = effectiveRole === 'client';
  const isFree = effectiveRole === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

  // Enhanced logging for debugging
  console.log('useUserRole state:', {
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
