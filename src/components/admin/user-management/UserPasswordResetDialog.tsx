
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { UserProfile } from "./types";
import PasswordFields from "@/components/PasswordFields";

interface UserPasswordResetDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordReset: () => void;
}

export const UserPasswordResetDialog = ({
  user,
  open,
  onOpenChange,
  onPasswordReset,
}: UserPasswordResetDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.email;

  const handleSubmitClick = () => {
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    setConfirmOpen(true);
  };

  const handlePasswordChange = async () => {
    console.log('🔐 Password reset initiated for user:', user.email, 'by current user');

    setIsLoading(true);
    
    try {
      console.log('🔐 Calling admin-change-password function for user:', user.id);
      const { data, error } = await supabase.functions.invoke('admin-change-password', {
        body: {
          userId: user.id,
          newPassword: password
        }
      });

      if (error) {
        console.error('🔐 Function invocation error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('🔐 Function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('🔐 Password change successful, data returned:', data);
      toast({
        title: "Success",
        description: `Password updated successfully for ${user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.email}`,
      });

      console.log('🔐 Calling onPasswordReset callback...');
      onPasswordReset();
      setConfirmOpen(false);
      onOpenChange(false);
      setPassword("");
      setConfirmPassword("");
      console.log('🔐 Password reset flow completed');
    } catch (error: any) {
      console.error('🔐 Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.email
            }. The password will be changed immediately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <PasswordFields
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={handlePasswordFieldChange}
            onConfirmPasswordChange={handleConfirmPasswordFieldChange}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitClick}
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? "Updating..." : "Change Password"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the password for <strong>{displayName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handlePasswordChange(); }}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Yes, change it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default UserPasswordResetDialog;
