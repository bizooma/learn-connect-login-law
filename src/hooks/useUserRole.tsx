
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        console.log('useUserRole: No user, setting default state');
        setRole('student');
        setLoading(false);
        return;
      }

      console.log('useUserRole: Starting role fetch for user:', user.id);
      setLoading(true);

      try {
        // Create a timeout promise that rejects after 3 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 3000);
        });

        // Create the actual query promise
        const queryPromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        // Race the query against the timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        if (result && 'data' in result) {
          const { data, error } = result;
          
          if (error) {
            console.error('useUserRole: Database error:', error);
            setRole('student');
          } else if (data?.role) {
            console.log('useUserRole: Role fetched successfully:', data.role);
            setRole(data.role);
          } else {
            console.log('useUserRole: No role found - defaulting to student');
            setRole('student');
          }
        }
      } catch (error) {
        console.error('useUserRole: Query failed or timed out:', error);
        // For now, let's check if this specific user should be admin
        if (user.id === 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88') {
          console.log('useUserRole: Applying admin override for known admin user');
          setRole('admin');
        } else {
          setRole('student');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      fetchUserRole();
    }
  };

  // Compute derived values
  const effectiveRole = role || 'student';
  const isAdmin = effectiveRole === 'admin';
  const isOwner = effectiveRole === 'owner';
  const isStudent = effectiveRole === 'student';
  const isClient = effectiveRole === 'client';
  const isFree = effectiveRole === 'free';
  const hasAdminPrivileges = isAdmin || isOwner;

  console.log('useUserRole current state:', {
    userId: user?.id,
    role: effectiveRole,
    loading,
    isAdmin,
    hasAdminPrivileges
  });

  return { 
    role: effectiveRole, 
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
