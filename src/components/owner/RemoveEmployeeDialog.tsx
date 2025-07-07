
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UserMinus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Profile = Tables<'profiles'>;
type LawFirm = Tables<'law_firms'>;

interface EmployeeProfile extends Profile {
  roles?: Array<{ role: string }>;
}

interface RemoveEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeProfile;
  lawFirm: LawFirm;
  onEmployeeRemoved: () => void;
}

const RemoveEmployeeDialog = ({ 
  open, 
  onOpenChange, 
  employee, 
  lawFirm, 
  onEmployeeRemoved 
}: RemoveEmployeeDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRemoveEmployee = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // 1. Remove the employee's profile from the law firm
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ law_firm_id: null })
        .eq('id', employee.id);

      if (profileError) throw profileError;

      // 2. Update the law firm's used seats count
      const { error: seatError } = await supabase
        .from('law_firms')
        .update({ used_seats: lawFirm.used_seats - 1 })
        .eq('id', lawFirm.id);

      if (seatError) throw seatError;

      // 3. Create a notification for admins
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'Employee Removed',
          message: `${lawFirm.name} removed employee ${employee.first_name} ${employee.last_name} (${employee.email}). Seat count updated from ${lawFirm.used_seats} to ${lawFirm.used_seats - 1}.`,
          type: 'info',
          created_by: user.id
        });

      if (notificationError) {
        logger.error('Failed to create notification:', notificationError);
        // Don't throw here as the main operation succeeded
      }

      toast({
        title: "Success",
        description: `${employee.first_name} ${employee.last_name} has been removed from your law firm. You now have an available seat.`,
      });

      onEmployeeRemoved();
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Error removing employee:', error);
      toast({
        title: "Error",
        description: `Failed to remove employee: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Remove Employee
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to remove <strong>{employee.first_name} {employee.last_name}</strong> from your law firm?
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens when you remove an employee:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• They will lose access to your law firm's courses and materials</li>
              <li>• One seat will become available for a new employee</li>
              <li>• Their learning progress will be preserved</li>
              <li>• You can add them back later if needed</li>
            </ul>
          </div>

          <div className="text-sm text-gray-500">
            <strong>Email:</strong> {employee.email}
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleRemoveEmployee}
            disabled={loading}
          >
            {loading ? (
              "Removing..."
            ) : (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Employee
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveEmployeeDialog;
