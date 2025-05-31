
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeCard from "./EmployeeCard";
import AddEmployeeDialog from "./AddEmployeeDialog";
import { useState } from "react";

interface EmployeeManagementProps {
  lawFirmId: string;
}

const EmployeeManagement = ({ lawFirmId }: EmployeeManagementProps) => {
  const { employees, loading, fetchEmployees } = useEmployees(lawFirmId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>Employee Management</CardTitle>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
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
              <Button onClick={() => setShowAddDialog(true)}>
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
        lawFirmId={lawFirmId}
        onEmployeeAdded={fetchEmployees}
      />
    </div>
  );
};

export default EmployeeManagement;
