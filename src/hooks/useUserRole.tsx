
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useUserRole: User changed, user:', user?.id);
    if (user) {
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, setting role to null');
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    console.log('useUserRole: Starting to fetch role for user:', user?.id);
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      console.log('useUserRole: Raw query result:', { data, error, userId: user?.id });

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        setRole('student'); // Default to student role if no role found
      } else {
        // Get the user's role or default to student
        const userRole = data?.[0]?.role || 'student';
        console.log('useUserRole: User roles found:', data);
        console.log('useUserRole: Final role determined:', userRole);
        setRole(userRole);
      }
    } catch (error) {
      console.error('useUserRole: Error in fetchUserRole:', error);
      setRole('student');
    } finally {
      console.log('useUserRole: Setting loading to false');
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isStudent = role === 'student';
  const isClient = role === 'client';
  const isFree = role === 'free';

  // Helper function to check if user has admin or owner privileges
  const hasAdminPrivileges = isAdmin || isOwner;

  console.log('useUserRole: Current state:', { 
    role, 
    isAdmin, 
    isOwner, 
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
    loading 
  };
};
