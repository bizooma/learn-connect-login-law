import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { logger } from "@/utils/logger";
import { Tables } from "@/integrations/supabase/types";
import { Loader2, Users, BookOpen } from "lucide-react";

type Course = Tables<'courses'>;

interface OwnerBulkCourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentsComplete: () => void;
  lawFirmId: string;
}

const OwnerBulkCourseAssignmentDialog = ({ open, onOpenChange, onAssignmentsComplete, lawFirmId }: OwnerBulkCourseAssignmentDialogProps) => {
  const { employees, loading: employeesLoading } = useEmployees(lawFirmId);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isMandatory, setIsMandatory] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_draft', false)
        .order('title', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      logger.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCourseSelection = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourseIds(prev => [...prev, courseId]);
    } else {
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === employees.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(employees.map(employee => employee.id));
    }
  };

  const handleSelectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map(course => course.id));
    }
  };

  const handleBulkAssignment = async () => {
    setLoading(true);
    try {
      const assignments = [];
      
      for (const userId of selectedUserIds) {
        for (const courseId of selectedCourseIds) {
          assignments.push({
            user_id: userId,
            course_id: courseId,
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            is_mandatory: isMandatory,
            notes: notes || null,
          });
        }
      }

      const { error } = await supabase
        .from('course_assignments')
        .upsert(assignments, { 
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully assigned ${assignments.length} courses`,
        variant: "default",
      });

      onAssignmentsComplete();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error with bulk assignment:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to complete bulk assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAssignments = selectedUserIds.length * selectedCourseIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Course Assignment</DialogTitle>
        </DialogHeader>
        
        {employeesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selection Summary */}
            {(selectedUserIds.length > 0 || selectedCourseIds.length > 0) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedUserIds.length} employee(s) selected
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {selectedCourseIds.length} course(s) selected
                  </Badge>
                  {totalAssignments > 0 && (
                    <Badge className="bg-blue-600">
                      {totalAssignments} total assignments
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Employee Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Employees</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllUsers}
                  disabled={employees.length === 0}
                >
                  {selectedUserIds.length === employees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-sm">No employees found in your law firm.</p>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedUserIds.includes(employee.id)}
                          onCheckedChange={(checked) => handleUserSelection(employee.id, checked as boolean)}
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="flex-1 cursor-pointer">
                          {employee.first_name} {employee.last_name} ({employee.email})
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Courses</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCourses}
                >
                  {selectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourseIds.includes(course.id)}
                        onCheckedChange={(checked) => handleCourseSelection(course.id, checked as boolean)}
                      />
                      <Label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                        {course.title} <span className="text-gray-500">({course.category})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignment Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mandatory"
                  checked={isMandatory}
                  onCheckedChange={setIsMandatory}
                />
                <Label htmlFor="mandatory">Mark as Mandatory</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-notes">Notes (Optional)</Label>
                <Textarea
                  id="bulk-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this bulk assignment..."
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleBulkAssignment}
                disabled={loading || selectedUserIds.length === 0 || selectedCourseIds.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${totalAssignments} Course${totalAssignments !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OwnerBulkCourseAssignmentDialog;