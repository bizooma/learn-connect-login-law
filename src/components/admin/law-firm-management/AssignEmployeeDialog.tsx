
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

type LawFirm = Tables<'law_firms'> & {
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  employee_count?: number;
};

interface AssignEmployeeDialogProps {
  lawFirm: LawFirm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: () => void;
}

const AssignEmployeeDialog = ({ 
  lawFirm, 
  open, 
  onOpenChange, 
  onEmployeeAdded 
}: AssignEmployeeDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    role: "student"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if law firm has available seats (using dynamic employee count)
  const currentEmployeeCount = lawFirm.employee_count || 0;
  const availableSeats = lawFirm.total_seats - currentEmployeeCount;
  const canAddEmployee = availableSeats > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    if (!canAddEmployee) {
      toast({
        title: "No Available Seats",
        description: "This law firm has used all available seats. Please increase seat count or remove an employee first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
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
        // Create new user via edge function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('You must be logged in to create users');
        }

        const { data, error } = await supabase.functions.invoke('create-single-user', {
          body: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            password: formData.password
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to create user');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        // Get the created user's profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', formData.email.toLowerCase())
          .single();

        if (profileError) throw profileError;
        employeeProfile = newProfile;

        // Update profile with law firm info
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            law_firm_id: lawFirm.id
          })
          .eq('id', employeeProfile.id)
          .select()
          .single();

        if (updateError) throw updateError;
        employeeProfile = updatedProfile;
      }

      // 2. Assign the role (always student for employees) - using UPSERT to avoid duplicate key errors
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: employeeProfile.id,
          role: 'student'
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        if (roleError.message?.includes('duplicate key')) {
          throw new Error('User already has a role assigned. Please try again or contact support.');
        }
        throw roleError;
      }

      // Note: No need to update seat count as we use dynamic counting from employee_count

      // 4. Create notification for admins
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'Admin Assigned Employee',
          message: `Admin assigned ${formData.firstName} ${formData.lastName} (${formData.email}) to ${lawFirm.name} as a student.`,
          type: 'info',
          audience: 'admin_only',
          created_by: user.id
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw here as the main operation succeeded
      }

      toast({
        title: "Success",
        description: `${formData.firstName} ${formData.lastName} has been created and assigned to ${lawFirm.name}. Password: ${formData.password}`,
        duration: 10000, // Show longer so owner can copy password
      });
      
      onEmployeeAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        role: "student"
      });
    } catch (error: any) {
      console.error('Error assigning employee:', error);
      toast({
        title: "Error",
        description: `Failed to assign employee: ${error.message}`,
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
            Assign Employee to {lawFirm.name}
          </DialogTitle>
        </DialogHeader>

        {!canAddEmployee && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This law firm has used all available seats. Please increase seat count or remove an employee first.
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
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="At least 8 characters"
                required
                disabled={loading || !canAddEmployee}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || !canAddEmployee}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Confirm password"
              required
              disabled={loading || !canAddEmployee}
            />
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
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-1">Available Seats</h4>
            <p className="text-sm text-blue-800">
              {availableSeats} of {lawFirm.total_seats} seats available
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
              {loading ? "Assigning..." : "Assign Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEmployeeDialog;
