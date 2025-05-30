
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, BookOpen } from "lucide-react";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
      <div className="relative">
        <img
          src={course.image_url || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <Badge className={getLevelColor(course.level)}>
            {getLevelDisplayName(course.level)}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 leading-tight">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">by {course.instructor}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {course.duration}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {(course.students_enrolled || 0).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
            <span className="text-sm font-medium">{course.rating || 0}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {(course.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button className="w-full" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Start Course
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
