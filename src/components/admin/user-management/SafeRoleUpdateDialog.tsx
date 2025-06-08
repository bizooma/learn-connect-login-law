
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";
import { getAvailableRoles } from "./userRoleUtils";
import { useUserRole } from "@/hooks/useUserRole";

interface SafeRoleUpdateDialogProps {
  user: UserProfile;
  currentRole: string;
  onRoleUpdated: () => void;
}

const SafeRoleUpdateDialog = ({ user, currentRole, onRoleUpdated }: SafeRoleUpdateDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isOwner } = useUserRole();

  const availableRoles = getAvailableRoles(isAdmin, isOwner);
  const requiredText = `CHANGE ROLE TO ${newRole.toUpperCase()}`;
  const isConfirmValid = confirmText === requiredText && newRole && newRole !== currentRole;

  const handleRoleUpdate = async () => {
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
      console.log('Attempting to update user role:', { userId: user.id, newRole, currentRole });
      
      // Call the new safe role update function
      const { data, error } = await supabase.rpc('update_user_role_safe', {
        p_user_id: user.id,
        p_new_role: newRole,
        p_reason: reason.trim()
      });

      console.log('Role update response:', { data, error });

      if (error) {
        console.error('Role update error:', error);
        throw new Error(error.message || 'Failed to update user role');
      }

      console.log('User role update successful:', data);

      toast({
        title: "Role Updated",
        description: `${user.email}'s role has been changed from ${currentRole} to ${newRole}.`,
      });

      setDialogOpen(false);
      setConfirmText("");
      setReason("");
      setNewRole("");
      onRoleUpdated();

    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <UserCog className="h-3 w-3" />
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <UserCog className="h-5 w-5 mr-2" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Changing role for <strong>{user.email}</strong> ({user.first_name} {user.last_name})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-900">Current Role: {currentRole}</h4>
            </div>
            <p className="text-sm text-yellow-800">
              This action will change the user's permissions and access level.
            </p>
          </div>

          <div>
            <Label htmlFor="newRole">New Role *</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem 
                    key={role.value} 
                    value={role.value}
                    disabled={role.value === currentRole}
                  >
                    {role.label} {role.value === currentRole && "(current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason for role change *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for changing this user's role..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          {newRole && newRole !== currentRole && (
            <div>
              <Label htmlFor="confirm">
                Type <code className="bg-gray-100 px-1 rounded">{requiredText}</code> to confirm
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={requiredText}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setConfirmText("");
              setReason("");
              setNewRole("");
              setDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRoleUpdate}
            disabled={loading || !isConfirmValid || !reason.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SafeRoleUpdateDialog;
