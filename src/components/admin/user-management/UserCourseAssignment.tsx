
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { useCoursesData } from "@/hooks/useCoursesData";

interface UserCourseAssignmentProps {
  userId: string;
  userEmail: string;
  userName: string;
  onAssignmentComplete?: () => void;
}

const UserCourseAssignment = ({ userId, userEmail, userName, onAssignmentComplete }: UserCourseAssignmentProps) => {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();
  const { courses, loading: coursesLoading } = useCoursesData();

  const handleClose = () => {
    if (onAssignmentComplete) {
      onAssignmentComplete();
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedCourse || !selectedStatus) {
      toast({
        title: "Missing Information",
        description: "Please select both a course and status",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      const now = new Date().toISOString();
      
      // Create or update user course progress
      const progressData = {
        user_id: userId,
        course_id: selectedCourse,
        status: selectedStatus,
        progress_percentage: selectedStatus === 'completed' ? 100 : 0,
        started_at: now,
        last_accessed_at: now,
        ...(selectedStatus === 'completed' && { completed_at: now })
      };

      const { error: progressError } = await supabase
        .from('user_course_progress')
        .upsert(progressData);

      if (progressError) throw progressError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('course_assignments')
        .upsert({
          user_id: userId,
          course_id: selectedCourse,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          assigned_at: now,
          notes: notes || `Manually assigned as ${selectedStatus}`,
          is_mandatory: false
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: "Course Assigned",
        description: `Successfully assigned course to ${userName} with status: ${selectedStatus}`,
      });

      // Reset form and close
      setSelectedCourse("");
      setSelectedStatus("");
      setNotes("");
      handleClose();

    } catch (error) {
      console.error('Error assigning course:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Assign Course</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Assign a course to {userName} ({userEmail}) and set their completion status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Select Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {coursesLoading ? (
                  <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : courses.length === 0 ? (
                  <SelectItem value="no-courses" disabled>No courses available</SelectItem>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Completion Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Choose status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment (e.g., 'Migrated from Kajabi')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignCourse}
            disabled={!selectedCourse || !selectedStatus || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Course'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserCourseAssignment;
