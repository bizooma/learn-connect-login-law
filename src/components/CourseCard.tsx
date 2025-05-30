
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";

type Course = Tables<'courses'>;

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleViewCourse = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex-shrink-0">
        {course.image_url && (
          <div className="w-full h-48 mb-4 overflow-hidden rounded-lg">
            <img
              src={course.image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
            <Badge className={getLevelColor(course.level)}>
              {getLevelDisplayName(course.level)}
            </Badge>
          </div>
          <Badge variant="outline" className="w-fit">
            {course.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {course.description && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {course.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-2" />
            <span>{course.students_enrolled || 0} students enrolled</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
            <span>{course.rating || 0} rating</span>
          </div>
          <p className="text-sm text-gray-600">
            Instructor: <span className="font-medium">{course.instructor}</span>
          </p>
        </div>

        {course.tags && course.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{course.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-shrink-0 pt-4">
        <Button 
          onClick={handleViewCourse}
          className="w-full"
        >
          View Course
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
