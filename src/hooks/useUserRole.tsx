
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchCountRef = useRef(0);
  const lastUserIdRef = useRef<string | null>(null);

  console.log('useUserRole: Hook called with user:', {
    userId: user?.id,
    hasUser: !!user,
    currentRole: role,
    fetchCount: fetchCountRef.current
  });

  const fetchUserRole = useCallback(async (userId: string) => {
    // Circuit breaker: prevent too many rapid fetches
    fetchCountRef.current += 1;
    if (fetchCountRef.current > 10) {
      console.error('useUserRole: Too many fetch attempts, circuit breaker activated');
      setLoading(false);
      return;
    }

    console.log('useUserRole: Fetching role for user:', userId, 'attempt:', fetchCountRef.current);

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      console.log('useUserRole: Query result:', { data, error, userId });

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        // If no role found, default to student
        if (error.code === 'PGRST116') {
          console.log('useUserRole: No role found, defaulting to student');
          setRole('student');
        } else {
          console.log('useUserRole: Database error, defaulting to student');
          setRole('student');
        }
      } else {
        const userRole = data?.role || 'student';
        console.log('useUserRole: Setting role to:', userRole);
        setRole(userRole);
      }
    } catch (error) {
      console.error('useUserRole: Catch block error:', error);
      console.log('useUserRole: Exception occurred, defaulting to student');
      setRole('student');
    } finally {
      console.log('useUserRole: Setting loading to false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUserId = user?.id;
    
    console.log('useUserRole: useEffect triggered', {
      currentUserId,
      lastUserId: lastUserIdRef.current,
      userChanged: currentUserId !== lastUserIdRef.current,
      currentRole: role,
      loading
    });
    
    // Reset fetch counter when user changes
    if (currentUserId !== lastUserIdRef.current) {
      fetchCountRef.current = 0;
      lastUserIdRef.current = currentUserId || null;
    }
    
    // Only fetch if we have a user ID and it's different from last time
    if (currentUserId && currentUserId !== lastUserIdRef.current) {
      fetchUserRole(currentUserId);
    } else if (!currentUserId) {
      console.log('useUserRole: No user, setting defaults');
      setRole(null);
      setLoading(false);
      fetchCountRef.current = 0;
    }
  }, [user?.id, fetchUserRole]);

  const refreshRole = useCallback(() => {
    console.log('useUserRole: refreshRole called');
    const currentUserId = user?.id;
    if (currentUserId) {
      fetchCountRef.current = 0; // Reset counter for manual refresh
      fetchUserRole(currentUserId);
    }
  }, [user?.id, fetchUserRole]);

  // Compute derived values
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isStudent = role === 'student';
  const isClient = role === 'client';
  const isFree = role === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

  // Log every computation
  console.log('useUserRole: Final values:', { 
    role,
    isAdmin,
    isOwner,
    isStudent,
    isClient,
    isFree,
    hasAdminPrivileges,
    loading,
    userId: user?.id
  });

  return { 
    role, 
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
