
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

interface AdminCourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
  onEdit: (course: Course) => void;
}

const AdminCourseCard = ({ course, onDelete, onEdit }: AdminCourseCardProps) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow relative overflow-hidden"
      style={{
        backgroundImage: course.image_url ? `url(${course.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Glassy overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      
      {/* Additional white semi-transparent layer behind text */}
      <div className="absolute inset-0 bg-white/30"></div>
      
      {/* Content with relative positioning to appear above overlay */}
      <div className="relative z-10">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {course.title}
              </CardTitle>
              <p className="text-sm text-gray-700 mt-1 font-medium">
                by {course.instructor}
              </p>
            </div>
            <Badge className={getLevelColor(course.level)}>
              {getLevelDisplayName(course.level)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-gray-700 line-clamp-2 mb-3 font-medium">
            {course.description}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span className="font-medium">{course.duration}</span>
            <span className="font-medium">{course.students_enrolled || 0} students</span>
            <span className="font-medium">★ {course.rating || 0}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-white/50">{course.category}</Badge>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onEdit(course)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onDelete(course.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default AdminCourseCard;
