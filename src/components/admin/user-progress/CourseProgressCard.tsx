
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Trash2 } from "lucide-react";

interface CourseProgressCardProps {
  course: {
    course_id: string;
    course_title: string;
    status: string;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
    last_accessed_at: string | null;
    completed_units: number;
    total_units: number;
  };
  onDelete: (courseId: string) => void;
}

const CourseProgressCard = ({ course, onDelete }: CourseProgressCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{course.course_title}</h4>
        <div className="flex items-center gap-2">
          {getStatusBadge(course.status)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(course.course_id)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div className="text-sm">
          <span className="text-gray-600">Progress: </span>
          <span className="font-medium">{course.progress_percentage}%</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Units: </span>
          <span className="font-medium">{course.completed_units}/{course.total_units}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Last Accessed: </span>
          <span className="font-medium">
            {course.last_accessed_at 
              ? new Date(course.last_accessed_at).toLocaleDateString()
              : 'Never'
            }
          </span>
        </div>
      </div>

      <Progress value={course.progress_percentage} className="w-full" />

      {course.completed_at && (
        <div className="text-sm text-green-600 mt-2">
          <CheckCircle className="h-4 w-4 inline mr-1" />
          Completed on {new Date(course.completed_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default CourseProgressCard;
