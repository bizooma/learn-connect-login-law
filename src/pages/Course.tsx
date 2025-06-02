
import { useParams, useNavigate } from "react-router-dom";
import { useCourse } from "@/hooks/useCourse";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useEffect } from "react";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseMainContent from "@/components/course/CourseMainContent";
import CourseLoading from "@/components/course/CourseLoading";
import CourseNotFound from "@/components/course/CourseNotFound";

const Course = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { course, selectedUnit, setSelectedUnit, loading, error } = useCourse(courseId!);
  const { updateCourseProgress } = useUserProgress(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (course && user) {
      updateCourseProgress(course.id, {
        status: 'in_progress',
        last_accessed_at: new Date().toISOString()
      });
    }
  }, [course, user, authLoading, navigate, updateCourseProgress]);

  if (authLoading || loading) {
    return <CourseLoading />;
  }

  if (error || !course) {
    return <CourseNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CourseHeader course={course} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <CourseSidebar
              courseId={course.id}
              lessons={course.lessons}
              selectedUnit={selectedUnit}
              onUnitSelect={setSelectedUnit}
            />
          </div>
          
          <div className="lg:col-span-3">
            <CourseMainContent 
              course={course} 
              selectedUnit={selectedUnit} 
              courseTitle={course.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;
