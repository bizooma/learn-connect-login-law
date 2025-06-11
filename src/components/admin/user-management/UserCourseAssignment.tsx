
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
  const [existingProgress, setExistingProgress] = useState<any>(null);
  const { toast } = useToast();
  const { courses, loading: coursesLoading } = useCoursesData();

  // Check for existing progress when course is selected
  useEffect(() => {
    const checkExistingProgress = async () => {
      if (!selectedCourse || !userId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', selectedCourse)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking existing progress:', error);
          return;
        }

        setExistingProgress(data);
        
        // Auto-select the current status if progress exists
        if (data) {
          setSelectedStatus(data.status);
        }
      } catch (error) {
        console.error('Error checking existing progress:', error);
      }
    };

    checkExistingProgress();
  }, [selectedCourse, userId]);

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
      const currentUser = await supabase.auth.getUser();
      
      if (!currentUser.data.user) {
        throw new Error('User not authenticated');
      }

      // Prepare progress data with proper conflict resolution
      const progressData = {
        user_id: userId,
        course_id: selectedCourse,
        status: selectedStatus,
        progress_percentage: selectedStatus === 'completed' ? 100 : 
                           selectedStatus === 'in_progress' ? (existingProgress?.progress_percentage || 0) : 0,
        started_at: existingProgress?.started_at || now,
        last_accessed_at: now,
        updated_at: now,
        ...(selectedStatus === 'completed' && { completed_at: now })
      };

      // Use proper upsert with conflict resolution for user_course_progress
      const { error: progressError } = await supabase
        .from('user_course_progress')
        .upsert(progressData, {
          onConflict: 'user_id,course_id'
        });

      if (progressError) {
        console.error('Progress upsert error:', progressError);
        throw new Error(`Failed to update course progress: ${progressError.message}`);
      }

      // Create or update assignment record with conflict resolution
      const assignmentData = {
        user_id: userId,
        course_id: selectedCourse,
        assigned_by: currentUser.data.user.id,
        assigned_at: now,
        notes: notes || `${existingProgress ? 'Updated' : 'Assigned'} as ${selectedStatus}`,
        is_mandatory: false,
        updated_at: now
      };

      const { error: assignmentError } = await supabase
        .from('course_assignments')
        .upsert(assignmentData, {
          onConflict: 'user_id,course_id'
        });

      if (assignmentError) {
        console.error('Assignment upsert error:', assignmentError);
        throw new Error(`Failed to create assignment: ${assignmentError.message}`);
      }

      const actionWord = existingProgress ? 'Updated' : 'Assigned';
      toast({
        title: `Course ${actionWord}`,
        description: `Successfully ${actionWord.toLowerCase()} course for ${userName} with status: ${selectedStatus}`,
      });

      // Reset form and close
      setSelectedCourse("");
      setSelectedStatus("");
      setNotes("");
      setExistingProgress(null);
      handleClose();

    } catch (error: any) {
      console.error('Error in course assignment:', error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign course. Please try again.",
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
            <DialogTitle>
              {existingProgress ? 'Update Course Assignment' : 'Assign Course'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {existingProgress 
              ? `Update the course assignment for ${userName} (${userEmail}). Current status: ${existingProgress.status}`
              : `Assign a course to ${userName} (${userEmail}) and set their completion status.`
            }
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
            {existingProgress && selectedCourse && (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ This user already has progress for this course (Current: {existingProgress.status}, {existingProgress.progress_percentage}% complete)
              </p>
            )}
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
              placeholder={existingProgress 
                ? `Update notes for this assignment (e.g., 'Updated status from ${existingProgress.status}')`
                : "Add any notes about this assignment (e.g., 'Migrated from Kajabi')"
              }
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
                {existingProgress ? 'Updating...' : 'Assigning...'}
              </>
            ) : (
              existingProgress ? 'Update Assignment' : 'Assign Course'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserCourseAssignment;
