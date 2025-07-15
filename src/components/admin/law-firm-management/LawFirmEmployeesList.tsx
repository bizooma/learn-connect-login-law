
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useEmployees } from '@/hooks/useEmployees';
import AdminEmployeeCard from './AdminEmployeeCard';

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
  const { employees, loading } = useEmployees(lawFirm.id);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto text-gray-400 mb-4 animate-spin" />
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees</h3>
            <p className="text-gray-600">
              This law firm currently has no employees.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Employees</h3>
            <p className="text-sm text-gray-500 mt-1">
              {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {employees.map((employee) => (
            <AdminEmployeeCard 
              key={employee.id} 
              employee={employee}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LawFirmEmployeesList;
