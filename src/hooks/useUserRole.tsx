
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        setRole('student'); // Default to student role if no role found
      } else {
        // Get the user's role or default to student
        const userRole = data?.[0]?.role || 'student';
        setRole(userRole);
      }
    } catch (error) {
      console.error('useUserRole: Error in fetchUserRole:', error);
      setRole('student');
    } finally {
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
