
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus, Users, BookOpen, Search } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import OwnerBulkCourseAssignmentDialog from "./OwnerBulkCourseAssignmentDialog";
import OwnerCourseAssignmentDialog from "./OwnerCourseAssignmentDialog";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type LawFirm = Tables<'law_firms'>;

interface OwnerCourseAssignmentTabProps {
  lawFirm: LawFirm;
}

const OwnerCourseAssignmentTab = ({ lawFirm }: OwnerCourseAssignmentTabProps) => {
  const { employees, loading: employeesLoading } = useEmployees(lawFirm.id);
  const { assignments, loading: assignmentsLoading, assignCourse, fetchAssignments } = useCourseAssignments();
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter assignments to only show those for employees of this law firm
  const employeeIds = employees.map(emp => emp.id);
  const firmAssignments = assignments.filter(assignment => 
    employeeIds.includes(assignment.user_id)
  );

  // Filter assignments based on search
  const filteredAssignments = firmAssignments.filter(assignment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.profiles?.first_name?.toLowerCase().includes(searchLower) ||
      assignment.profiles?.last_name?.toLowerCase().includes(searchLower) ||
      assignment.profiles?.email?.toLowerCase().includes(searchLower) ||
      assignment.courses?.title?.toLowerCase().includes(searchLower)
    );
  });

  if (employeesLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalAssignments = firmAssignments.length;
  const mandatoryAssignments = firmAssignments.filter(a => a.is_mandatory).length;
  const uniqueCourses = new Set(firmAssignments.map(a => a.course_id)).size;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Employee Course Assignments</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAssignDialog(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Course
              </Button>
              <Button onClick={() => setShowBulkAssignDialog(true)}>
                <Users className="h-4 w-4 mr-2" />
                Bulk Assignment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{employees.length}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{totalAssignments}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{mandatoryAssignments}</div>
                <div className="text-sm text-gray-600">Mandatory</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{uniqueCourses}</div>
                <div className="text-sm text-gray-600">Unique Courses</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assignments by employee name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Assignments List */}
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Employees Yet</h3>
              <p>Add team members to start assigning courses.</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Course Assignments</h3>
              <p>{searchTerm ? "No assignments match your search." : "Start by assigning courses to your team members."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {assignment.courses?.title || 'Unknown Course'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Assigned to: <span className="font-medium">
                          {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                        </span> ({assignment.profiles?.email})
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {assignment.is_mandatory && (
                        <Badge variant="destructive">Mandatory</Badge>
                      )}
                      <Badge variant="outline">{assignment.courses?.category}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>
                      Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                    </span>
                    {assignment.due_date && (
                      <span>
                        Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  {assignment.notes && (
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                      {assignment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OwnerCourseAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssignCourse={assignCourse}
        lawFirmId={lawFirm.id}
      />

      <OwnerBulkCourseAssignmentDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        onAssignmentsComplete={fetchAssignments}
        lawFirmId={lawFirm.id}
      />
    </div>
  );
};

export default OwnerCourseAssignmentTab;
