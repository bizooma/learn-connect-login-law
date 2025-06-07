
import { useParams, useNavigate } from "react-router-dom";
import { useCourse } from "@/hooks/useCourse";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useEffect } from "react";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseMainContent from "@/components/course/CourseMainContent";
import CourseLoading from "@/components/course/CourseLoading";
import CourseNotFound from "@/components/course/CourseNotFound";

const Course = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole(); // Changed from hasAdminPrivileges to isAdmin
  const { course, selectedUnit, setSelectedUnit, loading, error } = useCourse(courseId!);
  const { updateCourseProgress } = useUserProgress(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    // Check if non-admin user is trying to access a draft course (only admins can access drafts)
    if (course && course.is_draft && !isAdmin) {
      navigate("/courses");
      return;
    }

    if (course && user) {
      updateCourseProgress(course.id, 'in_progress', 0);
    }
  }, [course, user, authLoading, isAdmin, navigate, updateCourseProgress]); // Changed from hasAdminPrivileges to isAdmin

  if (authLoading || loading) {
    return <CourseLoading />;
  }

  if (error || !course) {
    return <CourseNotFound />;
  }

  // Additional check for draft course access (only admins can access drafts)
  if (course.is_draft && !isAdmin) {
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
