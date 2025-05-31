
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeCard from "./EmployeeCard";
import AddEmployeeDialog from "./AddEmployeeDialog";

type LawFirm = Tables<'law_firms'>;

interface EmployeeManagementProps {
  lawFirm: LawFirm;
}

const EmployeeManagement = ({ lawFirm }: EmployeeManagementProps) => {
  const { employees, loading, fetchEmployees } = useEmployees(lawFirm.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [lawFirm.id]);

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canAddMoreEmployees = lawFirm.used_seats < lawFirm.total_seats;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {lawFirm.used_seats} of {lawFirm.total_seats} seats used
              </p>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              disabled={!canAddMoreEmployees}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {!canAddMoreEmployees && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">
                You've reached your seat limit. Please upgrade your plan or remove employees to add more.
              </p>
            </div>
          )}

          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {employees.length === 0 ? "No employees added yet" : "No employees match your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
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
        lawFirm={lawFirm}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onEmployeeAdded={fetchEmployees}
      />
    </div>
  );
};

export default EmployeeManagement;
