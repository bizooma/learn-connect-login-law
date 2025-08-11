
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, Trash2, Award, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CourseProgressData {
  course_id: string;
  course_title: string;
  status: string;
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string | null;
  completed_units: number;
  total_units: number;
}

interface UserProgressCourseListProps {
  courses: CourseProgressData[];
  onDeleteCourse: (courseId: string) => void;
  onMarkCompleted?: (courseId: string) => void;
  onRefresh?: () => void;
  userId?: string;
}

const UserProgressCourseList = ({ 
  courses, 
  onDeleteCourse, 
  onMarkCompleted,
  onRefresh,
  userId 
}: UserProgressCourseListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleMarkCompleted = async (courseId: string) => {
    if (!userId) return;

    try {
      // Fetch all units in this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          units!inner(
            id
          )
        `)
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      const unitIds: string[] = (lessons || [])
        .flatMap((lesson: any) => (lesson.units || []).map((u: any) => u.id))
        .filter(Boolean);

      // Mark each unit completed for this user via admin RPC
      for (const unitId of unitIds) {
        const { error } = await supabase.rpc('admin_mark_unit_completed', {
          p_user_id: userId,
          p_unit_id: unitId,
          p_course_id: courseId,
          p_reason: 'Admin marked course completed'
        });
        if (error) throw error;
      }

      // Recalculate course progress reliably
      const { error: recalcError } = await supabase.rpc('update_course_progress_reliable', {
        p_user_id: userId,
        p_course_id: courseId,
      });
      if (recalcError) throw recalcError;

      toast({
        title: "Success",
        description: "All units marked completed and course progress updated",
      });

      if (onRefresh) onRefresh();

    } catch (error) {
      console.error('Error marking course as completed:', error);
      toast({
        title: "Error",
        description: "Failed to mark course as completed",
        variant: "destructive",
      });
    }
  };

  const handleRecalculate = async (courseId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc('update_course_progress_reliable', {
        p_user_id: userId,
        p_course_id: courseId,
      });
      if (error) throw error;
      toast({
        title: "Recalculated",
        description: "Course progress recalculated",
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error recalculating course progress:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate course progress",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No course assignments found for this user.
        </div>
      ) : (
        courses.map((course) => (
          <div key={course.course_id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium">{course.course_title}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course.completed_units}/{course.total_units} units
                  </span>
                  {course.last_accessed_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last accessed: {formatDate(course.last_accessed_at)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                {getStatusBadge(course.status)}
                <div className="text-sm font-medium">
                  {course.progress_percentage}%
                </div>
              </div>
            </div>
            
            <Progress value={course.progress_percentage} className="mb-3" />
            
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
              <div>
                <span className="font-medium">Started:</span> {formatDate(course.started_at)}
              </div>
              <div>
                <span className="font-medium">Completed:</span> {formatDate(course.completed_at)}
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex gap-2">
                {course.status !== 'completed' && (
                  <Button
                    onClick={() => handleMarkCompleted(course.course_id)}
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                  >
                    <Award className="h-3 w-3" />
                    Mark as Completed
                  </Button>
                )}
                <Button
                  onClick={() => handleRecalculate(course.course_id)}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Recalculate Progress
                </Button>
              </div>
              <Button
                onClick={() => onDeleteCourse(course.course_id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Remove Assignment
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserProgressCourseList;
