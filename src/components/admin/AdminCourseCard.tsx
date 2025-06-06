
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Image } from "lucide-react";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { Tables } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type Course = Tables<'courses'>;

interface AdminCourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
  onEdit: (course: Course) => void;
}

const AdminCourseCard = ({ course, onDelete, onEdit }: AdminCourseCardProps) => {
  const navigate = useNavigate();

  const handleViewCourse = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-white">
      {/* Course Image Section */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Image className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {/* Level Badge Overlay - moved to left */}
        <div className="absolute top-2 left-2">
          <Badge className={getLevelColor(course.level)}>
            {getLevelDisplayName(course.level)}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-1">
              {course.title}
            </CardTitle>
            <p className="text-sm text-gray-600 font-medium">
              by {course.instructor}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>{course.duration}</span>
          <span>{course.students_enrolled || 0} students</span>
          <span>★ {course.rating || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewCourse}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onEdit(course)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onDelete(course.id)}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCourseCard;
