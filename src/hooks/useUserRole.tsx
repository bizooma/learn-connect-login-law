
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no role found, default to student
        if (error.code === 'PGRST116') {
          console.log('No role found for user, defaulting to student');
          setRole('student');
        } else {
          console.error('Error fetching user role:', error);
          setRole('student');
        }
      } else {
        const userRole = data?.role || 'student';
        console.log('User role fetched:', userRole);
        setRole(userRole);
      }
    } catch (error) {
      console.error('useUserRole: Error fetching user role:', error);
      setRole('student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (user?.id) {
      fetchUserRole().then(() => {
        if (mounted) {
          // Role has been set
        }
      });
    } else {
      setRole(null);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      fetchUserRole();
    }
  };

  // Compute derived values
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isStudent = role === 'student';
  const isClient = role === 'client';
  const isFree = role === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

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
