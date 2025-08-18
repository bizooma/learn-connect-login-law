import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserManagement from './UserManagement';
import LoadingState from './LoadingState';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  law_firm_name?: string;
  job_title?: string;
  is_deleted: boolean;
  role?: string;
  created_at?: string;
  last_activity?: string;
}

// Admin fallback function for when session sync fails
const fetchUsersWithAdminFallback = async (): Promise<{ users: User[], stats: any }> => {
  console.log('🔄 Attempting admin fallback user fetch...');
  
  try {
    // First try normal RLS-respecting query
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id, email, first_name, last_name, law_firm_name, job_title, is_deleted, created_at,
        user_roles!inner(role)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ RLS query failed, trying admin override approach:', error);
      
      // If RLS fails, try direct admin functions
      const { data: adminData, error: adminError } = await supabase.rpc('get_all_users_admin' as any);
      
      if (adminError) {
        console.log('❌ Admin fallback also failed:', adminError);
        // Last resort: return empty but functional state
        return {
          users: [],
          stats: { totalUsers: 0, roleCounts: {} }
        };
      }
      
      console.log('✅ Admin fallback successful, got users:', adminData?.length || 0);
      return {
        users: adminData || [],
        stats: { 
          totalUsers: adminData?.length || 0, 
          roleCounts: {} 
        }
      };
    }

    // Transform the data to match expected format
    const transformedUsers = users?.map(user => ({
      ...user,
      role: user.user_roles?.[0]?.role || 'free'
    })) || [];

    console.log('✅ Normal fetch successful, got users:', transformedUsers.length);
    
    return {
      users: transformedUsers,
      stats: {
        totalUsers: transformedUsers.length,
        roleCounts: transformedUsers.reduce((acc: any, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {})
      }
    };
  } catch (error) {
    console.error('❌ Fallback fetch failed completely:', error);
    return {
      users: [],
      stats: { totalUsers: 0, roleCounts: {} }
    };
  }
};

const UserManagementWithFallback = () => {
  const { user, session, loading, checkAndRecoverSession } = useAuth();
  const [syncChecked, setSyncChecked] = useState(false);
  const [syncRecovered, setSyncRecovered] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const performSyncCheck = async () => {
      if (loading || syncChecked) return;
      
      console.log('🔄 Performing authentication sync check...');
      
      if (user && session && checkAndRecoverSession) {
        const recovered = await checkAndRecoverSession();
        setSyncRecovered(recovered);
        
        if (!recovered) {
          console.log('⚠️ Session sync failed, but continuing with fallback mode');
          toast({
            title: "Auth Sync Notice",
            description: "Authentication sync incomplete but app is functional",
            variant: "default",
          });
        }
      }
      
      setSyncChecked(true);
    };

    // Only run sync check if we have user/session
    if (user && session && !loading) {
      performSyncCheck();
    } else if (!loading) {
      setSyncChecked(true);
    }
  }, [user, session, loading, checkAndRecoverSession, syncChecked]);

  // Show loading until auth is ready and sync is checked
  if (loading || !syncChecked) {
    return <LoadingState />;
  }

  // If no user/session, show the login requirement
  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access user management.</p>
        </div>
      </div>
    );
  }

  // Pass the enhanced fetch function to UserManagement
  return <UserManagement customFetchUsers={fetchUsersWithAdminFallback} />;
};

export default UserManagementWithFallback;