
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
      
      // Test basic connection first
      console.log('useUserRole: Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('user_roles')
        .select('count', { count: 'exact', head: true });
      
      console.log('useUserRole: Connection test result:', { 
        testData, 
        testError,
        connectionWorking: !testError
      });
      
      if (testError) {
        console.error('useUserRole: Database connection failed:', testError);
        setRole('student');
        setLoading(false);
        return;
      }
      
      // First, let's see ALL roles in the database
      console.log('useUserRole: Fetching all roles in database...');
      const { data: allRoles, error: allRolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      console.log('useUserRole: ALL roles in database:', { 
        allRoles, 
        error: allRolesError,
        totalCount: allRoles?.length || 0
      });
      
      // Now try to fetch this user's specific role
      console.log('useUserRole: Fetching user-specific role...');
      const { data, error, count } = await supabase
        .from('user_roles')
        .select('role', { count: 'exact' })
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('useUserRole: User-specific query result:', { 
        data, 
        error, 
        count,
        userId: user.id,
        query: `SELECT role FROM user_roles WHERE user_id = '${user.id}'`
      });

      if (error) {
        console.error('useUserRole: Database error:', error);
        setRole('student'); // Default fallback on error
        setLoading(false);
        return;
      }

      if (data?.role) {
        console.log('useUserRole: Role fetched successfully:', data.role);
        setRole(data.role);
      } else {
        console.log('useUserRole: No role found for user - user may not have a role assigned');
        
        // Let's also check if the user exists in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        console.log('useUserRole: Profile check:', { 
          profileData, 
          profileError,
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
