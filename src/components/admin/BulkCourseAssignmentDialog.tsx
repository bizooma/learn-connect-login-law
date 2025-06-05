
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Loader2, Users, BookOpen } from "lucide-react";

type Profile = Tables<'profiles'>;
type Course = Tables<'courses'>;

interface BulkCourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentsComplete: () => void;
}

const BulkCourseAssignmentDialog = ({ open, onOpenChange, onAssignmentsComplete }: BulkCourseAssignmentDialogProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isMandatory, setIsMandatory] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchCourses();
    }
  }, [open]);

  const fetchUsers = async () => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setFetchingData(false);
    }
  };

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
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
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
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user.id));
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
    if (selectedUserIds.length === 0 || selectedCourseIds.length === 0) {
      toast({
        title: "Missing Selection",
        description: "Please select at least one user and one course",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      const assignments = [];
      const progressRecords = [];
      const now = new Date().toISOString();

      for (const userId of selectedUserIds) {
        for (const courseId of selectedCourseIds) {
          assignments.push({
            user_id: userId,
            course_id: courseId,
            assigned_by: currentUser.user.id,
            assigned_at: now,
            is_mandatory: isMandatory,
            notes: notes || `Bulk assignment - ${selectedCourseIds.length} course(s) to ${selectedUserIds.length} user(s)`
          });

          progressRecords.push({
            user_id: userId,
            course_id: courseId,
            status: 'not_started',
            progress_percentage: 0,
            started_at: now,
            last_accessed_at: now
          });
        }
      }

      // Insert assignments
      const { error: assignmentError } = await supabase
        .from('course_assignments')
        .upsert(assignments, { onConflict: 'user_id,course_id' });

      if (assignmentError) throw assignmentError;

      // Insert progress records
      const { error: progressError } = await supabase
        .from('user_course_progress')
        .upsert(progressRecords, { onConflict: 'user_id,course_id' });

      if (progressError) throw progressError;

      toast({
        title: "Bulk Assignment Complete",
        description: `Successfully assigned ${selectedCourseIds.length} course(s) to ${selectedUserIds.length} user(s)`,
      });

      // Reset form
      setSelectedUserIds([]);
      setSelectedCourseIds([]);
      setIsMandatory(false);
      setNotes("");
      onAssignmentsComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error with bulk assignment:', error);
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
        
        {fetchingData ? (
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
                    {selectedUserIds.length} user(s) selected
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

            {/* User Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Users</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllUsers}
                >
                  {selectedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                        {user.first_name} {user.last_name} ({user.email})
                      </Label>
                    </div>
                  ))}
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

export default BulkCourseAssignmentDialog;
