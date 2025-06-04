
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('useUserRole: Hook called with user:', {
    user: user,
    userId: user?.id,
    userEmail: user?.email,
    hasUser: !!user
  });

  const fetchUserRole = useCallback(async () => {
    console.log('useUserRole: fetchUserRole called with user:', {
      user: user,
      userId: user?.id,
      userExists: !!user
    });

    if (!user?.id) {
      console.log('useUserRole: No user ID available, user state:', user);
      setRole(null);
      setLoading(false);
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
  }, [user?.id]);

  useEffect(() => {
    console.log('useUserRole: useEffect triggered, user changed:', {
      user: user,
      userId: user?.id,
      userExists: !!user
    });
    
    if (user?.id) {
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, setting defaults');
      setRole(null);
      setLoading(false);
    }
  }, [user?.id, fetchUserRole]);

  const refreshRole = useCallback(() => {
    console.log('useUserRole: refreshRole called');
    if (user?.id) {
      fetchUserRole();
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
  console.log('useUserRole: Computing values:', { 
    role,
    isAdmin,
    isOwner,
    isStudent,
    isClient,
    isFree,
    hasAdminPrivileges,
    loading,
    userId: user?.id,
    userExists: !!user
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
