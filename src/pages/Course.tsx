
import { useParams, useNavigate } from "react-router-dom";
import { useCourse } from "@/hooks/useCourse";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUserRole } from "@/hooks/useUserRole";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useEffect, useRef } from "react";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseMainContent from "@/components/course/CourseMainContent";
import CourseLoading from "@/components/course/CourseLoading";
import CourseNotFound from "@/components/course/CourseNotFound";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";

const Course = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const { course, selectedUnit, setSelectedUnit, loading, error } = useCourse(courseId!);
  const { updateCourseProgress } = useUserProgress(user?.id);
  const { logCourseAccess } = useActivityTracking();
  const hasUpdatedProgress = useRef(false);
  const hasLoggedAccess = useRef(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    // Only update progress once when course and user are available
    if (course && user && !hasUpdatedProgress.current) {
      hasUpdatedProgress.current = true;
      updateCourseProgress(course.id, {
        status: 'in_progress',
        last_accessed_at: new Date().toISOString()
      });
    }

    // Log course access once
    if (course && user && !hasLoggedAccess.current) {
      hasLoggedAccess.current = true;
      logCourseAccess(course.id);
    }
  }, [course?.id, user?.id, authLoading, navigate, updateCourseProgress, logCourseAccess]);

  // Reset the refs when navigating to a different course
  useEffect(() => {
    hasUpdatedProgress.current = false;
    hasLoggedAccess.current = false;
  }, [courseId]);

  if (authLoading || loading) {
    return <CourseLoading />;
  }

  if (error || !course) {
    return <CourseNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
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
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </div>
      <LMSTreeFooter />
    </div>
  );
};

export default Course;
