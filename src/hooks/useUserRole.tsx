
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
        
        // Force the role to be a clean string
        const cleanedRole = String(userRole).replace(/[^\w]/g, '');
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

  // Direct string comparison without any transformations first
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isStudent = role === 'student';
  const isClient = role === 'client';
  const isFree = role === 'free';

  // Helper function to check if user has admin or owner privileges
  const hasAdminPrivileges = isAdmin || isOwner;

  console.log('useUserRole: Final state:', { 
    role, 
    roleType: typeof role,
    roleLength: role?.length,
    isAdmin, 
    isOwner, 
    hasAdminPrivileges, 
    loading,
    directComparison: role === 'admin',
    adminString: 'admin',
    adminStringLength: 'admin'.length,
    rolesMatch: JSON.stringify(role) === JSON.stringify('admin')
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
