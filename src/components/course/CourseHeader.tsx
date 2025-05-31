
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";

type Course = Tables<'courses'>;

interface CourseHeaderProps {
  course: Course;
}

const CourseHeader = ({ course }: CourseHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/courses")}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div className="flex items-center space-x-4">
              <Badge className={getLevelColor(course.level)}>
                {getLevelDisplayName(course.level)}
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                {course.rating || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-6">{course.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {course.students_enrolled || 0} students
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {course.duration}
                </div>
                <div>
                  Instructor: <span className="font-medium text-gray-900">{course.instructor}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              {course.image_url && (
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseHeader;
