
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, AlertCircle } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeCard from "./EmployeeCard";
import AddEmployeeDialog from "./AddEmployeeDialog";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tables } from "@/integrations/supabase/types";

type LawFirm = Tables<'law_firms'>;

interface EmployeeManagementProps {
  lawFirm: LawFirm;
}

const EmployeeManagement = ({ lawFirm }: EmployeeManagementProps) => {
  const { employees, loading, fetchEmployees } = useEmployees(lawFirm.id);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const availableSeats = lawFirm.total_seats - lawFirm.used_seats;
  const canAddEmployee = availableSeats > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seat Usage Alert */}
      {availableSeats <= 2 && (
        <Alert className={availableSeats === 0 ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
          <AlertCircle className={`h-4 w-4 ${availableSeats === 0 ? "text-red-600" : "text-yellow-600"}`} />
          <AlertDescription className={availableSeats === 0 ? "text-red-800" : "text-yellow-800"}>
            {availableSeats === 0 
              ? "You've used all your available seats. Remove an employee or purchase more seats to add new employees."
              : `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} remaining. Consider purchasing more seats soon.`
            }
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>Employee Management</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {lawFirm.used_seats} / {lawFirm.total_seats} seats used
              </div>
              <Button 
                onClick={() => setShowAddDialog(true)}
                disabled={!canAddEmployee}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees yet</h3>
              <p className="text-gray-500 mb-4">
                Start building your team by adding your first employee.
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                disabled={!canAddEmployee}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  lawFirm={lawFirm}
                  onEmployeeUpdated={fetchEmployees}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddEmployeeDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        lawFirm={lawFirm}
        onEmployeeAdded={fetchEmployees}
        canAddEmployee={canAddEmployee}
      />
    </div>
  );
};

export default EmployeeManagement;
