
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  console.log('useUserRole: Hook called with user:', {
    user: user,
    userId: user?.id,
    userEmail: user?.email,
    hasUser: !!user,
    authLoading
  });

  const fetchUserRole = useCallback(async () => {
    // Don't fetch if auth is still loading or user is null
    if (authLoading || !user?.id) {
      console.log('useUserRole: Skipping fetch - auth loading or no user ID', {
        authLoading,
        userId: user?.id,
        userExists: !!user
      });
      if (!authLoading && !user) {
        // Auth is done loading but no user - set defaults
        setRole(null);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      console.log('useUserRole: Fetching role for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('useUserRole: Query result:', { data, error, userId: user.id });

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        
        // If no role found, default to student
        if (error.code === 'PGRST116') {
          console.log('useUserRole: No role found, defaulting to student');
          setRole('student');
        } else {
          console.log('useUserRole: Database error, defaulting to student');
          setRole('student');
          
          // Retry logic for transient errors
          if (retryCount < 3) {
            console.log(`useUserRole: Retrying in 1 second (attempt ${retryCount + 1}/3)`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
            return;
          }
        }
      } else {
        const userRole = data?.role || 'student';
        console.log('useUserRole: Setting role to:', userRole);
        setRole(userRole);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (error) {
      console.error('useUserRole: Catch block error:', error);
      console.log('useUserRole: Exception occurred, defaulting to student');
      setRole('student');
      
      // Retry logic for exceptions
      if (retryCount < 3) {
        console.log(`useUserRole: Retrying in 1 second (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000);
        return;
      }
    } finally {
      console.log('useUserRole: Setting loading to false');
      setLoading(false);
    }
  }, [user?.id, authLoading, retryCount]);

  useEffect(() => {
    console.log('useUserRole: useEffect triggered', {
      user: user,
      userId: user?.id,
      userExists: !!user,
      authLoading
    });
    
    fetchUserRole();
  }, [fetchUserRole]);

  const refreshRole = useCallback(() => {
    console.log('useUserRole: refreshRole called');
    setRetryCount(0);
    if (user?.id && !authLoading) {
      fetchUserRole();
    }
  }, [user?.id, authLoading, fetchUserRole]);

  // Compute derived values safely
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isTeamLeader = role === 'team_leader';
  const isStudent = role === 'student';
  const isClient = role === 'client';
  const isFree = role === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

  // Only show loading if auth is loading OR we're loading roles for an authenticated user
  const actualLoading = authLoading || (!!user && loading);

  // Log every computation
  console.log('useUserRole: Computing values:', { 
    role,
    isAdmin,
    isOwner,
    isTeamLeader,
    isStudent,
    isClient,
    isFree,
    hasAdminPrivileges,
    loading: actualLoading,
    userId: user?.id,
    userExists: !!user,
    authLoading
  });

  return { 
    role, 
    isAdmin, 
    isOwner, 
    isTeamLeader,
    isStudent, 
    isClient, 
    isFree, 
    hasAdminPrivileges,
    loading: actualLoading,
    refreshRole
  };
};
