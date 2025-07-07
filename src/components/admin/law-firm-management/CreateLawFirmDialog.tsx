
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAvailableOwners } from '@/hooks/useAvailableOwners';
import { logger } from '@/utils/logger';

interface CreateLawFirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateLawFirmDialog = ({ open, onOpenChange }: CreateLawFirmDialogProps) => {
  const { toast } = useToast();
  const { availableOwners, loading: ownersLoading } = useAvailableOwners();
  const [formData, setFormData] = useState({
    name: '',
    ownerId: '',
    totalSeats: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.ownerId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('law_firms')
        .insert({
          name: formData.name.trim(),
          owner_id: formData.ownerId,
          total_seats: formData.totalSeats,
          used_seats: 0
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Law firm created successfully",
      });

      // Reset form and close dialog
      setFormData({ name: '', ownerId: '', totalSeats: 5 });
      onOpenChange(false);
      
      // Refresh the page to show the new law firm
      window.location.reload();
    } catch (error: any) {
      logger.error('Error creating law firm:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create law firm",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Law Firm</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Law Firm Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter law firm name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">Owner *</Label>
            <Select 
              value={formData.ownerId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownerId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {ownersLoading ? (
                  <SelectItem value="loading" disabled>Loading owners...</SelectItem>
                ) : availableOwners.length === 0 ? (
                  <SelectItem value="none" disabled>No available owners</SelectItem>
                ) : (
                  availableOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.first_name && owner.last_name 
                        ? `${owner.first_name} ${owner.last_name} (${owner.email})`
                        : owner.email
                      }
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats">Total Seats</Label>
            <Input
              id="seats"
              type="number"
              min="1"
              max="1000"
              value={formData.totalSeats}
              onChange={(e) => setFormData(prev => ({ ...prev, totalSeats: parseInt(e.target.value) || 5 }))}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Law Firm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLawFirmDialog;
