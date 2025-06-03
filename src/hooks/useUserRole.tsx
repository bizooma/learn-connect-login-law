
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user?.id) {
      console.log('useUserRole: No user ID available');
      setRole('student'); // Default fallback
      setLoading(false);
      return;
    }

    try {
      console.log(`useUserRole: Fetching role for user ${user.id}`);
      
      // Add more detailed logging for the database query
      const { data, error, count } = await supabase
        .from('user_roles')
        .select('role', { count: 'exact' })
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('useUserRole: Database query result:', { 
        data, 
        error, 
        count,
        userId: user.id 
      });

      if (error) {
        console.error('useUserRole: Database error:', error);
        
        // Try a different approach - select all roles for debugging
        console.log('useUserRole: Attempting to fetch all roles for debugging...');
        const { data: allRoles, error: allRolesError } = await supabase
          .from('user_roles')
          .select('*');
        
        console.log('useUserRole: All roles in database:', { 
          allRoles, 
          error: allRolesError 
        });
        
        setRole('student'); // Default fallback on error
        setLoading(false);
        return;
      }

      if (data?.role) {
        console.log('useUserRole: Role fetched successfully:', data.role);
        setRole(data.role);
      } else {
        console.log('useUserRole: No role found for user, checking if any roles exist...');
        
        // Debug: Check if any roles exist for this user at all
        const { data: debugRoles, error: debugError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);
          
        console.log('useUserRole: Debug - roles for this user:', { 
          debugRoles, 
          debugError,
          userIdFromAuth: user.id 
        });
        
        setRole('student');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('useUserRole: Unexpected error:', error);
      setRole('student'); // Final fallback
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      console.log('useUserRole: User changed, fetching role for:', user.id);
      setLoading(true);
      setRole(null); // Clear previous role
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, setting default state');
      setRole('student');
      setLoading(false);
    }
  }, [user?.id]);

  const refreshRole = () => {
    if (user?.id) {
      console.log('useUserRole: Manual role refresh requested');
      setLoading(true);
      setRole(null); // Clear current role
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
