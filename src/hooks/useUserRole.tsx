
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  logger.log('useUserRole: Hook called', { 
    userId: user?.id, 
    email: user?.email, 
    authLoading, 
    roleLoading: loading 
  });

  // Direct admin check function
  const isDirectAdmin = useCallback((email: string | undefined) => {
    if (!email) return false;
    const directAdmins = [
      'joe@bizooma.com', 
      'admin@newfrontieruniversity.com', 
      'erin.walsh@newfrontier.us', 
      'carolina@newfrontieruniversity.com'
    ];
    const isAdmin = directAdmins.includes(email);
    logger.log('useUserRole: Direct admin check', { email, isAdmin });
    return isAdmin;
  }, []);

  const fetchUserRole = useCallback(async () => {
    logger.log('useUserRole: fetchUserRole called', { 
      authLoading, 
      userId: user?.id, 
      email: user?.email 
    });
    
    // Don't fetch if auth is still loading
    if (authLoading) {
      logger.log('useUserRole: Auth still loading, skipping role fetch');
      return;
    }

    // If no user after auth is complete, set role to null
    if (!user?.id) {
      logger.log('useUserRole: No user found after auth complete, setting role to null');
      setRole(null);
      setLoading(false);
      return;
    }

    // Check if user is a direct admin first - this is the highest priority
    if (isDirectAdmin(user.email)) {
      logger.log('useUserRole: User is direct admin, setting admin role');
      setRole('admin');
      setLoading(false);
      return;
    }

    logger.log('useUserRole: Fetching role from database for user:', user.id);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      logger.log('useUserRole: Database query result', { 
        data, 
        error, 
        userId: user.id 
      });

      if (error) {
        logger.error('useUserRole: Database error, defaulting to free role', error);
        setRole('free');
      } else {
        const userRole = data?.role || 'free';
        logger.log('useUserRole: Setting role from database', { 
          role: userRole, 
          userId: user.id 
        });
        setRole(userRole);
      }
    } catch (error) {
      logger.error('useUserRole: Exception during role fetch, defaulting to free', error);
      setRole('free');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, authLoading, isDirectAdmin]);

  useEffect(() => {
    logger.log('useUserRole: useEffect triggered', { 
      authLoading, 
      userId: user?.id, 
      currentRole: role 
    });
    
    // Reset role when user changes (including logout)
    if (!user?.id && role !== null) {
      logger.log('useUserRole: User cleared, resetting role to null');
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [fetchUserRole]);

  const refreshRole = useCallback(() => {
    logger.log('useUserRole: refreshRole called');
    if (user?.id && !authLoading) {
      setLoading(true);
      fetchUserRole();
    }
  }, [user?.id, authLoading, fetchUserRole]);

  // Compute derived values safely - use memoization to prevent constant recalculation
  const isAdmin = useMemo(() => {
    const result = role === 'admin';
    logger.log('useUserRole: isAdmin computed', { role, isAdmin: result });
    return result;
  }, [role]);
  
  const isOwner = useMemo(() => role === 'owner', [role]);
  const isTeamLeader = useMemo(() => role === 'team_leader', [role]);
  
  const isStudent = useMemo(() => {
    const result = role === 'student';
    logger.log('useUserRole: isStudent computed', { role, isStudent: result });
    return result;
  }, [role]);
  
  const isClient = useMemo(() => role === 'client', [role]);
  const isFree = useMemo(() => role === 'free', [role]);
  const hasAdminPrivileges = useMemo(() => isAdmin || isOwner, [isAdmin, isOwner]);

  // Simplified loading state - only loading if auth is loading OR we're loading roles
  const actualLoading = authLoading || loading;

  logger.log('useUserRole: Hook returning', { 
    role, 
    isStudent, 
    isFree, 
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
