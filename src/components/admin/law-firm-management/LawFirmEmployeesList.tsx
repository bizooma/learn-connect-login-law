
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type LawFirm = Tables<'law_firms'> & {
  owner?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  employee_count?: number;
};

interface LawFirmEmployeesListProps {
  lawFirm: LawFirm;
}

const LawFirmEmployeesList = ({ lawFirm }: LawFirmEmployeesListProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Management</h3>
          <p className="text-gray-600 mb-4">
            Employee list and management features will be implemented in the next phase.
          </p>
          <p className="text-sm text-gray-500">
            Current employee count: {lawFirm.employee_count || 0}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LawFirmEmployeesList;
