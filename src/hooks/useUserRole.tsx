
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('useUserRole: Hook called', { userId: user?.id, email: user?.email, authLoading, roleLoading: loading });

  // Direct admin check function
  const isDirectAdmin = useCallback((email: string | undefined) => {
    if (!email) return false;
    const directAdmins = ['joe@bizooma.com', 'admin@newfrontieruniversity.com', 'erin.walsh@newfrontier.us', 'carolina@newfrontieruniversity.com'];
    const isAdmin = directAdmins.includes(email);
    console.log('useUserRole: Direct admin check', { email, isAdmin });
    return isAdmin;
  }, []);

  const fetchUserRole = useCallback(async () => {
    console.log('useUserRole: fetchUserRole called', { authLoading, userId: user?.id, email: user?.email });
    
    // Don't fetch if auth is still loading or user is null
    if (authLoading || !user?.id) {
      console.log('useUserRole: Skipping fetch - auth loading or no user', { authLoading, hasUser: !!user });
      if (!authLoading && !user) {
        console.log('useUserRole: No user after auth complete, setting role to null');
        setRole(null);
        setLoading(false);
      }
      return;
    }

    // Check if user is a direct admin first
    if (isDirectAdmin(user.email)) {
      console.log('useUserRole: User is direct admin, setting role');
      setRole('admin');
      setLoading(false);
      // Clear timeout since we successfully set a role
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      return;
    }

    console.log('useUserRole: Fetching role from database for user', user.id);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('useUserRole: Database query result', { data, error, userId: user.id });

      if (error) {
        console.error('useUserRole: Database error, defaulting to student', error);
        setRole('student');
      } else {
        const userRole = data?.role || 'student';
        console.log('useUserRole: Setting role from database', { role: userRole, userId: user.id });
        setRole(userRole);
      }
      setLoading(false);
      
      // Clear timeout since we successfully completed the role fetch
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('useUserRole: Exception, defaulting to student', error);
      setRole('student');
      setLoading(false);
      
      // Clear timeout on error as well
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [user?.id, user?.email, authLoading, isDirectAdmin]);

  useEffect(() => {
    console.log('useUserRole: useEffect triggered', { authLoading, userId: user?.id, currentRole: role });
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Only set up timeout if we don't already have a role and we have a user
    if (!role && user?.id && !authLoading) {
      // Set up emergency timeout to prevent infinite loading, but only if no role is set
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('useUserRole: Checking timeout conditions', { 
          loading, 
          hasUser: !!user?.id, 
          currentRole: role,
          timeoutRef: !!loadingTimeoutRef.current 
        });
        
        // Only override if we're still loading AND we don't have any role set
        if (loading && user?.id && !role) {
          console.warn('useUserRole: Loading timeout reached, defaulting to student role for user', user.id);
          setRole('student');
          setLoading(false);
        } else {
          console.log('useUserRole: Timeout fired but conditions not met - not overriding role', { 
            loading, 
            hasUser: !!user?.id, 
            currentRole: role 
          });
        }
      }, 5000); // 5 second timeout
    }

    fetchUserRole();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [fetchUserRole, role]);

  const refreshRole = useCallback(() => {
    console.log('useUserRole: refreshRole called');
    if (user?.id && !authLoading) {
      fetchUserRole();
    }
  }, [user?.id, authLoading, fetchUserRole]);

  // Compute derived values safely - use memoization to prevent constant recalculation
  const isAdmin = useMemo(() => {
    const result = role === 'admin';
    console.log('useUserRole: isAdmin computed', { role, isAdmin: result });
    return result;
  }, [role]);
  const isOwner = useMemo(() => role === 'owner', [role]);
  const isTeamLeader = useMemo(() => role === 'team_leader', [role]);
  const isStudent = useMemo(() => {
    const result = role === 'student';
    console.log('useUserRole: isStudent computed', { role, isStudent: result });
    return result;
  }, [role]);
  const isClient = useMemo(() => role === 'client', [role]);
  const isFree = useMemo(() => role === 'free', [role]);
  const hasAdminPrivileges = useMemo(() => isAdmin || isOwner, [isAdmin, isOwner]);

  // Only show loading if auth is loading OR we're loading roles for an authenticated user
  const actualLoading = authLoading || (!!user && loading);

  console.log('useUserRole: Hook returning', { 
    role, 
    isStudent, 
    actualLoading, 
    authLoading, 
    roleLoading: loading,
    userId: user?.id 
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
