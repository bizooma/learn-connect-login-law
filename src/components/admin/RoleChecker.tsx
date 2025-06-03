
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RoleChecker = () => {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (email, first_name, last_name)
        `);

      if (error) throw error;
      
      console.log('User roles data:', data);
      setUserRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error",
        description: `Failed to fetch user roles: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => {
    try {
      // First delete existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: newRole 
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUserRoles();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  if (loading) {
    return <div>Loading user roles...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Roles Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userRoles.length === 0 ? (
            <p>No user roles found in database</p>
          ) : (
            userRoles.map((userRole) => (
              <div key={userRole.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p><strong>Email:</strong> {userRole.profiles?.email || 'Unknown'}</p>
                  <p><strong>Name:</strong> {userRole.profiles?.first_name} {userRole.profiles?.last_name}</p>
                  <p><strong>Current Role:</strong> {userRole.role}</p>
                  <p><strong>User ID:</strong> {userRole.user_id}</p>
                </div>
                <div className="space-x-2">
                  {userRole.role !== 'admin' && (
                    <Button
                      onClick={() => updateUserRole(userRole.user_id, 'admin')}
                      variant="outline"
                    >
                      Make Admin
                    </Button>
                  )}
                  {userRole.role !== 'student' && (
                    <Button
                      onClick={() => updateUserRole(userRole.user_id, 'student')}
                      variant="outline"
                    >
                      Make Student
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          
          <Button onClick={fetchUserRoles} variant="outline">
            Refresh Roles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleChecker;
