
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import UserSearch from "./user-management/UserSearch";
import UserGrid from "./user-management/UserGrid";
import { filterUsers } from "./user-management/userRoleUtils";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  roles?: Array<{ role: string }>;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin, isOwner } = useUserRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Fetch user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: userRoles?.filter(role => role.user_id === profile.id) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => {
    try {
      // Check if current user can assign this role
      if (isOwner && !isAdmin && (newRole === 'admin' || newRole === 'owner')) {
        toast({
          title: "Access Denied",
          description: "Owners cannot assign admin or owner roles",
          variant: "destructive",
        });
        return;
      }

      // First, remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) {
        throw error;
      }

      // Refresh users list
      fetchUsers();
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = filterUsers(users, searchTerm);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />
      <UserGrid 
        users={filteredUsers} 
        onRoleUpdate={updateUserRole} 
      />
    </div>
  );
};

export default UserManagement;
