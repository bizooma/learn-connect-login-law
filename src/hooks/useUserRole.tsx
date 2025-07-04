
import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Direct admin check function
  const isDirectAdmin = useCallback((email: string | undefined) => {
    if (!email) return false;
    return ['joe@bizooma.com', 'admin@newfrontieruniversity.com'].includes(email);
  }, []);

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

    // Check if user is a direct admin first
    if (isDirectAdmin(user.email)) {
      console.log('useUserRole: User is direct admin:', user.email);
      setRole('admin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('useUserRole: Fetching role for user:', user.id);
      
      // Use direct query with proper error handling for RLS issues
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('useUserRole: Query result:', { data, error, userId: user.id });

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        console.log('useUserRole: Database error, defaulting to student');
        setRole('student');
        setLoading(false);
        
        // Retry logic for transient errors
        if (retryCount < 2) {
          console.log(`useUserRole: Retrying in 1 second (attempt ${retryCount + 1}/2)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
          return;
        }
      } else {
        const userRole = data?.role || 'student';
        console.log('useUserRole: Setting role to:', userRole);
        setRole(userRole);
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (error) {
      console.error('useUserRole: Catch block error:', error);
      console.log('useUserRole: Exception occurred, defaulting to student');
      setRole('student');
      setLoading(false);
      
      // Retry logic for exceptions
      if (retryCount < 2) {
        console.log(`useUserRole: Retrying in 1 second (attempt ${retryCount + 1}/2)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 1000);
        return;
      }
    }
  }, [user?.id, user?.email, authLoading, retryCount, isDirectAdmin]);

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

  // Compute derived values safely - use memoization to prevent constant recalculation
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isOwner = useMemo(() => role === 'owner', [role]);
  const isTeamLeader = useMemo(() => role === 'team_leader', [role]);
  const isStudent = useMemo(() => role === 'student', [role]);
  const isClient = useMemo(() => role === 'client', [role]);
  const isFree = useMemo(() => role === 'free', [role]);
  const hasAdminPrivileges = useMemo(() => isAdmin || isOwner, [isAdmin, isOwner]);

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
    authLoading,
    isDirectAdminCheck: isDirectAdmin(user?.email)
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
