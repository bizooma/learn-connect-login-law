
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Users, Clock, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { getLevelColor, getLevelDisplayName } from "@/utils/courseUtils";
import { useEnrollmentCounts } from "@/hooks/useEnrollmentCounts";
import { useUserRole } from "@/hooks/useUserRole";

type Course = Tables<'courses'>;

interface CourseHeaderProps {
  course: Course;
}

const CourseHeader = ({ course }: CourseHeaderProps) => {
  const navigate = useNavigate();
  const { enrollmentCounts } = useEnrollmentCounts(false); // Disable realtime for course header
  const { isAdmin, isOwner, isStudent, isClient, isFree } = useUserRole();

  // Get actual enrollment count
  const enrollmentCount = enrollmentCounts[course.id] || 0;

  const handleBackToDashboard = () => {
    if (isAdmin) {
      navigate("/dashboard");
    } else if (isOwner) {
      navigate("/owner-dashboard");
    } else if (isStudent) {
      navigate("/student-dashboard");
    } else if (isClient) {
      navigate("/client-dashboard");
    } else if (isFree) {
      navigate("/free-dashboard");
    } else {
      // Default fallback
      navigate("/dashboard");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="hover:bg-white/10 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <a 
                href="https://newfrontieruniversity.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img 
                  src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                  alt="New Frontier University" 
                  className="h-10 w-auto"
                />
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getLevelColor(course.level)}>
                {getLevelDisplayName(course.level)}
              </Badge>
              <div className="flex items-center text-sm text-white">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                {course.rating || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Header */}
      <div className="border-b" style={{ backgroundColor: '#213C82' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-white mb-4">{course.title}</h1>
              <p className="text-white/90 mb-6">{course.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {enrollmentCount} students
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {course.duration}
                </div>
                <div>
                  Instructor: <span className="font-medium text-white">{course.instructor}</span>
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
