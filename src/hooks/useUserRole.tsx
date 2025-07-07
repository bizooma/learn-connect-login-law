
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const retryCountRef = useRef(0);
  const fetchingRef = useRef(false);

  logger.log('useUserRole: Hook called with user:', {
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
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    
    // Don't fetch if auth is still loading or user is null
    if (authLoading || !user?.id) {
      if (!authLoading && !user) {
        setRole(null);
        setLoading(false);
      }
      return;
    }

    // Check if user is a direct admin first
    if (isDirectAdmin(user.email)) {
      setRole('admin');
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('useUserRole: Error fetching user role:', error);
        setRole('student');
        setLoading(false);
        
        // Retry logic for transient errors
        if (retryCountRef.current < 2) {
          retryCountRef.current += 1;
          setTimeout(() => {
            fetchingRef.current = false;
            fetchUserRole();
          }, 1000);
          return;
        }
      } else {
        const userRole = data?.role || 'student';
        setRole(userRole);
        setLoading(false);
        retryCountRef.current = 0;
      }
    } catch (error) {
      logger.error('useUserRole: Exception occurred:', error);
      setRole('student');
      setLoading(false);
      
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        setTimeout(() => {
          fetchingRef.current = false;
          fetchUserRole();
        }, 1000);
        return;
      }
    }
    
    fetchingRef.current = false;
  }, [user?.id, user?.email, authLoading, isDirectAdmin]);

  useEffect(() => {
    logger.log('useUserRole: useEffect triggered', {
      user: user,
      userId: user?.id,
      userExists: !!user,
      authLoading
    });
    
    fetchUserRole();
  }, [fetchUserRole]);

  const refreshRole = useCallback(() => {
    retryCountRef.current = 0;
    fetchingRef.current = false;
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

  // Reduce logging to prevent performance issues

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
