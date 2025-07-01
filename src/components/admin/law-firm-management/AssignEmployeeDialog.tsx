
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

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
}

const AssignEmployeeDialog = ({ lawFirm, open, onOpenChange }: AssignEmployeeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Employee to {lawFirm.name}</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Assignment</h3>
              <p className="text-gray-600 mb-4">
                Employee assignment functionality will be implemented in the next phase.
              </p>
              <p className="text-sm text-gray-500">
                Available seats: {lawFirm.total_seats - lawFirm.used_seats}
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEmployeeDialog;
