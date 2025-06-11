
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { useUserRole } from "@/hooks/useUserRole";

type Course = Tables<'courses'>;

interface CourseWithEnrollment extends Course {
  actual_enrollment_count?: number;
}

interface CourseCardProps {
  course: CourseWithEnrollment;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  const handleViewCourse = () => {
    navigate(`/course/${course.id}`);
  };

  // Use actual enrollment count if available, otherwise fall back to the database field
  const enrollmentCount = course.actual_enrollment_count ?? course.students_enrolled ?? 0;

  return (
    <Card className={`h-full flex flex-col hover:shadow-lg transition-shadow duration-200 ${course.is_draft ? 'bg-gray-50 border-dashed' : 'bg-white'}`}>
      {/* Course Image Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className={`h-full w-full object-cover transition-transform duration-200 hover:scale-105 ${course.is_draft ? 'opacity-70' : ''}`}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center ${course.is_draft ? 'opacity-70' : ''}`}>
            <Image className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {/* Level and Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <Badge className={getLevelColor(course.level)}>
            {getLevelDisplayName(course.level)}
          </Badge>
          {/* Show draft status badge only to admins */}
          {isAdmin && course.is_draft && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Draft
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="space-y-2">
            <CardTitle className={`text-xl line-clamp-2 leading-tight ${course.is_draft ? 'text-gray-600' : ''}`}>{course.title}</CardTitle>
            <Badge variant="outline" className="w-fit">
              {course.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pt-0">
          {course.description && (
            <p className={`text-sm line-clamp-3 mb-4 ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
              {course.description}
            </p>
          )}
          
          <div className="space-y-3">
            <div className={`flex items-center text-sm ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              <span>{enrollmentCount} students enrolled</span>
            </div>
            <div className={`flex items-center text-sm ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
              <Clock className="h-4 w-4 mr-2 text-green-500" />
              <span>{course.duration}</span>
            </div>
            <div className={`flex items-center text-sm ${course.is_draft ? 'text-gray-500' : 'text-gray-600'}`}>
              <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
              <span>{course.rating || 0} rating</span>
            </div>
            <div className={`text-sm border-t pt-3 ${course.is_draft ? 'text-gray-500' : 'text-gray-700'}`}>
              <span className="text-gray-500">Instructor:</span>
              <span className="font-semibold ml-1">{course.instructor}</span>
            </div>
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
            disabled={course.is_draft && !isAdmin}
          >
            View Course
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default CourseCard;
