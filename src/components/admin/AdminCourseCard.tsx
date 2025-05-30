
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
}

const AdminCourseCard = ({ course, onDelete }: AdminCourseCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {course.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              by {course.instructor}
            </p>
          </div>
          <Badge className={getLevelColor(course.level)}>
            {getLevelDisplayName(course.level)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {course.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{course.duration}</span>
          <span>{course.students_enrolled || 0} students</span>
          <span>★ {course.rating || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">
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
    </Card>
  );
};

export default AdminCourseCard;
