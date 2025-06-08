
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const requiredText = "DEACTIVATE USER";
  const isConfirmValid = confirmText === requiredText;

  const handleSoftDelete = async () => {
    if (!isConfirmValid || !reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason and type the confirmation text exactly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to soft delete user:', user.id);
      
      // Call the new safe soft delete function
      const { data, error } = await supabase.rpc('soft_delete_user', {
        p_user_id: user.id,
        p_reason: reason.trim()
      });

      console.log('Soft delete response:', { data, error });

      if (error) {
        console.error('Soft delete error:', error);
        throw new Error(error.message || 'Failed to deactivate user');
      }

      console.log('User soft deletion successful:', data);

      toast({
        title: "User Deactivated",
        description: `${user.email} has been deactivated successfully. They can be restored from the Inactive Users tab.`,
      });

      setDialogOpen(false);
      setConfirmText("");
      setReason("");
      onUserDeleted();

    } catch (error: any) {
      console.error('Error soft deleting user:', error);
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
            This will <strong>deactivate</strong> the user account for <strong>{user.email}</strong> ({user.first_name} {user.last_name}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">What happens when you deactivate:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• User will be unable to log in</li>
              <li>• Account data is preserved (not deleted)</li>
              <li>• Can be restored at any time from Inactive Users tab</li>
              <li>• All audit trails are maintained</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="reason">Reason for deactivation *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for deactivating this user..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirm">Type <code className="bg-gray-100 px-1 rounded">{requiredText}</code> to confirm</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredText}
              className="mt-1"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setConfirmText("");
            setReason("");
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSoftDelete}
            disabled={loading || !isConfirmValid || !reason.trim()}
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
