
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
    <Card 
      className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 relative overflow-hidden"
      style={{
        backgroundImage: course.image_url ? `url(${course.image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Glassy overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      
      {/* Content with relative positioning to appear above overlay */}
      <div className="relative z-10 h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
              <Badge className={getLevelColor(course.level)}>
                {getLevelDisplayName(course.level)}
              </Badge>
            </div>
            <Badge variant="outline" className="w-fit bg-white/50">
              {course.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          {course.description && (
            <p className="text-gray-700 text-sm line-clamp-3 mb-4 font-medium">
              {course.description}
            </p>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">{course.students_enrolled || 0} students enrolled</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span className="font-medium">{course.duration}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{course.rating || 0} rating</span>
            </div>
            <p className="text-sm text-gray-700">
              Instructor: <span className="font-semibold">{course.instructor}</span>
            </p>
          </div>

          {course.tags && course.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {course.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-white/50">
                  {tag}
                </Badge>
              ))}
              {course.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-white/50">
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
      </div>
    </Card>
  );
};

export default CourseCard;
