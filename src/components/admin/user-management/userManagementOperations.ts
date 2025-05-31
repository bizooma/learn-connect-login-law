
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  cleanupOrphanedRoles as cleanupOrphanedRolesService,
  createMissingProfiles as createMissingProfilesService,
  updateUserRole as updateUserRoleService
} from "./userDataService";

export const useUserManagementOperations = (fetchUsers: () => Promise<void>) => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const cleanupOrphanedRoles = async (setIsCleaningUp: (value: boolean) => void) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can cleanup orphaned roles",
        variant: "destructive",
      });
      return;
    }

    setIsCleaningUp(true);
    try {
      const deletedCount = await cleanupOrphanedRolesService();
      
      toast({
        title: "Success",
        description: `Cleaned up ${deletedCount} orphaned roles`,
      });

      // Refresh the data
      await fetchUsers();
    } catch (error: any) {
      console.error('Error cleaning up orphaned roles:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup orphaned roles",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const createMissingProfiles = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can create missing profiles",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdCount = await createMissingProfilesService();

      if (createdCount === 0) {
        toast({
          title: "Info",
          description: "No missing profiles found",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Created ${createdCount} missing profiles`,
      });

      // Refresh the data
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating missing profiles:', error);
      toast({
        title: "Error",
        description: "Failed to create missing profiles",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'owner' | 'student' | 'client' | 'free') => {
    try {
      // Check if current user can assign this role
      if (!isAdmin && (newRole === 'admin' || newRole === 'owner')) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to assign admin or owner roles",
          variant: "destructive",
        });
        return;
      }

      await updateUserRoleService(userId, newRole);

      // Refresh users list
      await fetchUsers();
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  return {
    cleanupOrphanedRoles,
    createMissingProfiles,
    updateUserRole
  };
};
