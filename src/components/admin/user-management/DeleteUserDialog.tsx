
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";
import { logger } from "@/utils/logger";

interface DeleteUserDialogProps {
  user: UserProfile;
  onUserDeleted: () => void;
}

const DeleteUserDialog = ({ user, onUserDeleted }: DeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      logger.log('Attempting to delete user:', user.id);
      logger.log('Current session:', await supabase.auth.getSession());
      
      // Call the edge function to delete the user
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      logger.log('Edge function response:', { data, error });

      if (error) {
        logger.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to delete user');
      }

      if (data?.error) {
        logger.error('Server error:', data.error);
        throw new Error(data.error);
      }

      logger.log('User deletion successful:', data);

      toast({
        title: "Success",
        description: `User ${user.email} has been deleted successfully`,
      });

      onUserDeleted();

    } catch (error: any) {
      logger.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the user account for <strong>{user.email}</strong> ({user.first_name} {user.last_name}).
            This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
