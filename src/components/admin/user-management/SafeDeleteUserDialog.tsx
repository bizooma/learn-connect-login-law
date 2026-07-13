
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserMinus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";

interface SafeDeleteUserDialogProps {
  user: UserProfile;
  onUserDeleted: () => void;
}

const SafeDeleteUserDialog = ({ user, onUserDeleted }: SafeDeleteUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  const handleSoftDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.rpc('soft_delete_user', {
        p_user_id: user.id,
        p_reason: 'Deactivated by admin'
      });

      if (error) {
        throw new Error(error.message || 'Failed to deactivate user');
      }

      toast({
        title: "User Deactivated",
        description: `${user.email} has been deactivated. They can be restored from the Inactive Users tab.`,
      });

      setDialogOpen(false);
      onUserDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-orange-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Deactivate User Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate <strong>{displayName}</strong>? They can be restored later from the Inactive Users tab.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleSoftDelete(); }}
            disabled={loading}
            className="bg-orange-600 text-white hover:bg-orange-700"
          >
            {loading ? "Deactivating..." : "Deactivate User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SafeDeleteUserDialog;

