
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const fetchUserRole = async (userId: string, attempt: number = 1) => {
    try {
      console.log(`useUserRole: Fetching role for user ${userId} (attempt ${attempt})`);
      
      // Test basic connectivity first
      const { data: testData, error: testError } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('useUserRole: Database connectivity test failed:', testError);
        throw testError;
      }

      // Create a promise that times out after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 5000);
      });

      // Race the query against the timeout
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('useUserRole: Query result:', { 
        data, 
        error, 
        userId,
        attempt
      });

      if (error) {
        console.error('useUserRole: Database error:', error);
        
        // Retry once on failure
        if (attempt === 1) {
          console.log('useUserRole: Retrying query...');
          return await fetchUserRole(userId, 2);
        }
        
        // After retry fails, default to student
        setRole('student');
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
      console.error('useUserRole: Fetch error:', error);
      
      // Retry once on timeout/error
      if (attempt === 1) {
        console.log('useUserRole: Retrying after error...');
        setTimeout(() => {
          fetchUserRole(userId, 2);
        }, 1000);
        return;
      }
      
      // Final fallback
      console.log('useUserRole: Final fallback to student role');
      setRole('student');
      setLoading(false);
    }
  };

  // Single useEffect to handle all user changes and role fetching
  useEffect(() => {
    console.log('useUserRole: Effect triggered', { 
      userId: user?.id, 
      fetchAttempted 
    });

    if (!user?.id) {
      console.log('useUserRole: No user, resetting to default state');
      setRole('student');
      setLoading(false);
      setFetchAttempted(false);
      return;
    }

    // Only fetch if we haven't attempted for this user yet
    if (!fetchAttempted) {
      console.log('useUserRole: Starting role fetch for user:', user.id);
      setLoading(true);
      setRole(null);
      setFetchAttempted(true);
      fetchUserRole(user.id);
    }
  }, [user?.id, fetchAttempted]);

  // Reset fetch flag when user changes
  useEffect(() => {
    setFetchAttempted(false);
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      setFetchAttempted(false);
      setLoading(true);
      setRole(null);
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
    hasAdminPrivileges,
    fetchAttempted
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
