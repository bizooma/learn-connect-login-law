
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";

type LawFirm = Tables<'law_firms'>;

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lawFirm: LawFirm;
  onEmployeeAdded: () => void;
  canAddEmployee: boolean;
}

const AddEmployeeDialog = ({ 
  open, 
  onOpenChange, 
  lawFirm, 
  onEmployeeAdded, 
  canAddEmployee 
}: AddEmployeeDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "student"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!canAddEmployee) {
      toast({
        title: "No Available Seats",
        description: "You have used all your available seats. Please remove an employee or purchase more seats.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user already exists in the system
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .maybeSingle();

      if (profileCheckError) throw profileCheckError;

      let employeeProfile;

      if (existingProfile) {
        // User exists - check if they're already part of another law firm
        if (existingProfile.law_firm_id && existingProfile.law_firm_id !== lawFirm.id) {
          toast({
            title: "Error",
            description: "This user is already employed by another law firm.",
            variant: "destructive",
          });
          return;
        }

        // Update existing profile with law firm info
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            law_firm_id: lawFirm.id,
            first_name: formData.firstName,
            last_name: formData.lastName
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (updateError) throw updateError;
        employeeProfile = updatedProfile;
      } else {
        // Create invitation for new user (simplified - in real implementation you'd send an email invitation)
        toast({
          title: "Feature Coming Soon",
          description: "Employee invitation system is under development. For now, employees need to register first, then you can add them.",
          variant: "default",
        });
        setLoading(false);
        return;
      }

      // 2. Assign the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employeeProfile.id);

      if (roleError) console.error('Error removing old roles:', roleError);

      const { error: newRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: employeeProfile.id,
          role: formData.role as 'student' | 'client'
        });

      if (newRoleError) throw newRoleError;

      // 3. Update law firm seat count
      const { error: seatError } = await supabase
        .from('law_firms')
        .update({ used_seats: lawFirm.used_seats + 1 })
        .eq('id', lawFirm.id);

      if (seatError) throw seatError;

      // 4. Create notification for admins
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'New Employee Added',
          message: `${lawFirm.name} added new employee ${formData.firstName} ${formData.lastName} (${formData.email}) with role ${formData.role}. Seat count updated to ${lawFirm.used_seats + 1}/${lawFirm.total_seats}.`,
          type: 'info',
          created_by: user.id
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw here as the main operation succeeded
      }

      toast({
        title: "Success",
        description: `${formData.firstName} ${formData.lastName} has been added to your law firm.`,
      });
      
      onEmployeeAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "student"
      });
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: `Failed to add employee: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add New Employee
          </DialogTitle>
        </DialogHeader>

        {!canAddEmployee && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You have used all your available seats. Please remove an employee or purchase more seats to add new employees.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="employee@example.com"
              required
              disabled={loading || !canAddEmployee}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="John"
                required
                disabled={loading || !canAddEmployee}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Doe"
                required
                disabled={loading || !canAddEmployee}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleChange("role", value)}
              disabled={loading || !canAddEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">Available Seats</h4>
            <p className="text-sm text-blue-800">
              {lawFirm.total_seats - lawFirm.used_seats} of {lawFirm.total_seats} seats available
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !canAddEmployee}
            >
              {loading ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
