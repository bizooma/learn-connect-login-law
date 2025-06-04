
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    setIsLoading(true);
    
    try {
      // Send password reset email instead of trying to update password directly
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset email has been sent to ${user.email}`,
      });

      onPasswordReset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Error",
        description: `Failed to send password reset email: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Send a password reset email to {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.email
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            A password reset email will be sent to <strong>{user.email}</strong>. 
            They will be able to set a new password by clicking the link in the email.
          </p>
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
            disabled={isLoading}
          >
            {isLoading ? "Sending Email..." : "Send Reset Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserPasswordResetDialog;
