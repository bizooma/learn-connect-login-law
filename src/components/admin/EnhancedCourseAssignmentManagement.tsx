
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle, Calendar, Trash2, BookOpen, Users, Search, Filter } from "lucide-react";
import { useCourseAssignments } from "@/hooks/useCourseAssignments";
import CourseAssignmentDialog from "./CourseAssignmentDialog";
import BulkCourseAssignmentDialog from "./BulkCourseAssignmentDialog";
import MarkCompletedDialog from "./MarkCompletedDialog";
import { format } from "date-fns";

const EnhancedCourseAssignmentManagement = () => {
  const { assignments, loading, assignCourse, markCourseCompleted, removeAssignment, fetchAssignments } = useCourseAssignments();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = searchTerm === "" || 
      assignment.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || assignment.course_id === courseFilter;
    
    // For status filter, we'd need to check actual progress - simplified for now
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "mandatory" && assignment.is_mandatory) ||
      (statusFilter === "optional" && !assignment.is_mandatory);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const uniqueCourses = Array.from(new Set(assignments.map(a => a.courses?.id).filter(Boolean)));
  const totalAssignments = assignments.length;
  const mandatoryAssignments = assignments.filter(a => a.is_mandatory).length;
  const optionalAssignments = totalAssignments - mandatoryAssignments;

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
              <Button onClick={() => setShowAssignDialog(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Single Assignment
              </Button>
              <Button onClick={() => setShowBulkAssignDialog(true)}>
                <Users className="h-4 w-4 mr-2" />
                Bulk Assignment
              </Button>
              <Button variant="secondary" onClick={() => setShowCompletedDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <div className="text-2xl font-bold text-blue-600">{optionalAssignments}</div>
                <div className="text-sm text-gray-600">Optional</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{uniqueCourses.length}</div>
                <div className="text-sm text-gray-600">Unique Courses</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mandatory">Mandatory Only</SelectItem>
                <SelectItem value="optional">Optional Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map((courseId) => {
                  const course = assignments.find(a => a.course_id === courseId)?.courses;
                  return course ? (
                    <SelectItem key={courseId} value={courseId}>
                      {course.title}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active Assignments ({filteredAssignments.length})</TabsTrigger>
              <TabsTrigger value="all">All Assignments ({assignments.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== "all" || courseFilter !== "all" 
                    ? "No assignments match your current filters."
                    : "No course assignments found."
                  }
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAssignment(assignment.id)}
                            className="text-red-600 hover:bg-red-50"
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
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
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
                      className="border rounded-lg p-4 space-y-3"
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

      {/* Dialogs */}
      <CourseAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onAssignCourse={assignCourse}
      />

      <BulkCourseAssignmentDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        onAssignmentsComplete={fetchAssignments}
      />

      <MarkCompletedDialog
        open={showCompletedDialog}
        onOpenChange={setShowCompletedDialog}
        onMarkCompleted={markCourseCompleted}
      />
    </div>
  );
};

export default EnhancedCourseAssignmentManagement;
