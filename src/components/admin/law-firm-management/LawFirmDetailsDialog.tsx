
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import LawFirmEmployeesList from './LawFirmEmployeesList';

type LawFirm = Tables<'law_firms'> & {
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  employee_count?: number;
};

interface LawFirmDetailsDialogProps {
  lawFirm: LawFirm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LawFirmDetailsDialog = ({ lawFirm, open, onOpenChange }: LawFirmDetailsDialogProps) => {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: lawFirm.name,
    totalSeats: lawFirm.total_seats
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Law firm name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('law_firms')
        .update({
          name: formData.name.trim(),
          total_seats: formData.totalSeats
        })
        .eq('id', lawFirm.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Law firm updated successfully",
      });

      setEditMode(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating law firm:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update law firm",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOwnerDisplayName = () => {
    if (!lawFirm.owner) return 'Unknown Owner';
    const { first_name, last_name, email } = lawFirm.owner;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>{lawFirm.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {getOwnerDisplayName()}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Seat Usage</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={lawFirm.used_seats < lawFirm.total_seats ? "default" : "destructive"}>
                    {lawFirm.used_seats}/{lawFirm.total_seats}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    ({lawFirm.total_seats - lawFirm.used_seats} available)
                  </span>
                </div>
              </div>
            </div>

            {editMode ? (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Law Firm Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-seats">Total Seats</Label>
                  <Input
                    id="edit-seats"
                    type="number"
                    min={lawFirm.used_seats} // Can't reduce below current usage
                    max="1000"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum: {lawFirm.used_seats} (current usage)
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleUpdate} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditMode(false);
                      setFormData({ name: lawFirm.name, totalSeats: lawFirm.total_seats });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(true)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Law Firm Details
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees">
            <LawFirmEmployeesList lawFirm={lawFirm} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LawFirmDetailsDialog;
