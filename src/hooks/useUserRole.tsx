
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      console.log('useUserRole: Fetching role for user:', user?.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      console.log('useUserRole: Raw query result:', { data, error });

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        setRole('student'); // Default to student role if error
      } else {
        // Get the user's role or default to student
        const userRole = data?.[0]?.role || 'student';
        console.log('useUserRole: Setting role to:', userRole);
        console.log('useUserRole: Role type:', typeof userRole);
        console.log('useUserRole: Role length:', userRole?.length);
        console.log('useUserRole: Role charCodes:', userRole?.split('').map(c => c.charCodeAt(0)));
        
        // Force the role to be a clean string and set it directly
        const cleanedRole = String(userRole).trim();
        console.log('useUserRole: Cleaned role:', cleanedRole);
        console.log('useUserRole: Cleaned role charCodes:', cleanedRole?.split('').map(c => c.charCodeAt(0)));
        
        setRole(cleanedRole);
      }
    } catch (error) {
      console.error('useUserRole: Error in fetchUserRole:', error);
      setRole('student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('useUserRole: User changed, fetching role for:', user.id);
      fetchUserRole();
    } else {
      console.log('useUserRole: No user, setting role to null');
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const refreshRole = () => {
    console.log('useUserRole: refreshRole called');
    if (user) {
      fetchUserRole();
    }
  };

  // Use explicit string comparison with proper null checks
  const isAdmin = role !== null && role === 'admin';
  const isOwner = role !== null && role === 'owner';
  const isStudent = role !== null && role === 'student';
  const isClient = role !== null && role === 'client';
  const isFree = role !== null && role === 'free';

  // Helper function to check if user has admin or owner privileges
  const hasAdminPrivileges = isAdmin || isOwner;

  console.log('useUserRole: Final state comparison:', { 
    role, 
    roleType: typeof role,
    roleValue: JSON.stringify(role),
    adminString: JSON.stringify('admin'),
    strictEquality: role === 'admin',
    isAdmin, 
    isOwner, 
    hasAdminPrivileges, 
    loading
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
