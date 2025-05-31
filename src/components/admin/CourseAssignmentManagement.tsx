
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, CheckCircle, Calendar, Trash2, BookOpen } from "lucide-react";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import CourseAssignmentDialog from "./CourseAssignmentDialog";
import MarkCompletedDialog from "./MarkCompletedDialog";
import { format } from "date-fns";

const CourseAssignmentManagement = () => {
  const { assignments, loading, assignCourse, markCourseCompleted, removeAssignment } = useCourseAssignments();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeAssignments = assignments.filter(a => {
    // Check if there's progress and it's not completed
    return true; // For now, show all assignments
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Course Assignment Management</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Course
              </Button>
              <Button variant="secondary" onClick={() => setShowCompletedDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Assignments</TabsTrigger>
              <TabsTrigger value="all">All Assignments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {activeAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active course assignments found.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {assignment.courses?.title || 'Unknown Course'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Assigned to: {assignment.profiles?.first_name} {assignment.profiles?.last_name} ({assignment.profiles?.email})
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {assignment.is_mandatory && (
                            <Badge variant="destructive">Mandatory</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                        </span>
                        {assignment.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      
                      {assignment.notes && (
                        <p className="text-sm text-gray-600 italic">
                          {assignment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No course assignments found.
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {assignment.courses?.title || 'Unknown Course'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Assigned to: {assignment.profiles?.first_name} {assignment.profiles?.last_name} ({assignment.profiles?.email})
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {assignment.is_mandatory && (
                            <Badge variant="destructive">Mandatory</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                        </span>
                        {assignment.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      
                      {assignment.notes && (
                        <p className="text-sm text-gray-600 italic">
                          {assignment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CourseAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssignCourse={assignCourse}
      />

      <MarkCompletedDialog
        open={showCompletedDialog}
        onOpenChange={setShowCompletedDialog}
        onMarkCompleted={markCourseCompleted}
      />
    </div>
  );
};

export default CourseAssignmentManagement;
