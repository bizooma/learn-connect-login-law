
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Password updated successfully for ${user.email}`,
      });

      onPasswordReset();
      onOpenChange(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.email
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <PasswordFields
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={handlePasswordChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
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
            onClick={handlePasswordReset}
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPasswordResetDialog;
