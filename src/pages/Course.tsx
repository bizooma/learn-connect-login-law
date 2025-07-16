
import { useParams, useNavigate } from "react-router-dom";
import { useCourse } from "@/hooks/useCourse";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useCourseRealtimeManager } from "@/hooks/useCourseRealtimeManager";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSidebar from "@/components/course/CourseSidebar";
import CourseMainContent from "@/components/course/CourseMainContent";
import CourseLoading from "@/components/course/CourseLoading";
import CourseNotFound from "@/components/course/CourseNotFound";

const Course = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const { course, selectedUnit, setSelectedUnit, loading, error, refreshCourse } = useCourse(courseId!);
  const { updateCourseProgress } = useUserProgress(user?.id);

  // Function to check if user is assigned to course and ensure progress exists without overwriting
  const checkCourseAssignment = async (courseId: string, userId: string) => {
    try {
      const { data: assignment } = await supabase
        .from('course_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (assignment) {
        console.log('Course: User is assigned, checking if progress record exists');
        
        // Check if progress record already exists
        const { data: existingProgress } = await supabase
          .from('user_course_progress')
          .select('id, progress_percentage, status')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (!existingProgress) {
          console.log('Course: No progress record exists, creating initial progress');
          // Only create initial progress if none exists - don't overwrite existing progress
          updateCourseProgress(courseId, 'not_started', 0);
        } else {
          console.log('Course: Progress record already exists, preserving current values:', {
            progress: existingProgress.progress_percentage,
            status: existingProgress.status
          });
          // Don't overwrite existing progress - let it remain as calculated by bulk tool
        }
      } else {
        console.log('Course: User not assigned to this course, no progress record created');
      }
    } catch (error) {
      console.log('Course: User not assigned to this course');
    }
  };

  // Safely handle error for logging
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
      return (err as Error).message;
    }
    return 'Unknown error';
  };

  console.log('Course: Component state:', {
    courseId,
    hasUser: !!user,
    authLoading,
    courseLoading: loading,
    hasCourse: !!course,
    error: getErrorMessage(error),
    isAdmin
  });

  useEffect(() => {
    console.log('Course: Auth/navigation useEffect triggered:', {
      authLoading,
      hasUser: !!user,
      courseExists: !!course,
      courseIsDraft: course?.is_draft,
      isAdmin
    });

    if (!authLoading && !user) {
      console.log('Course: No user found, redirecting to login');
      navigate("/");
      return;
    }

    // Check if non-admin user is trying to access a draft course (only admins can access drafts)
    if (course && course.is_draft && !isAdmin) {
      console.log('Course: Non-admin trying to access draft course, redirecting');
      navigate("/courses");
      return;
    }

    // Only update progress if user has been assigned this course
    if (course && user && !isAdmin) {
      // Check if user is assigned to this course before creating progress
      checkCourseAssignment(course.id, user.id);
    }
  }, [course, user, authLoading, isAdmin, navigate, updateCourseProgress]);

  // Set up centralized real-time subscriptions for course content changes
  useCourseRealtimeManager({
    courseId: courseId!,
    onCourseStructureChange: refreshCourse
  });

  if (authLoading || loading) {
    console.log('Course: Showing loading state:', { authLoading, loading });
    return <CourseLoading />;
  }

  if (error || !course) {
    console.log('Course: Showing not found state:', { error: getErrorMessage(error), hasCourse: !!course });
    return <CourseNotFound />;
  }

  // Additional check for draft course access (only admins can access drafts)
  if (course.is_draft && !isAdmin) {
    console.log('Course: Draft course access denied for non-admin');
    return <CourseNotFound />;
  }

  console.log('Course: Rendering course content:', {
    courseTitle: course.title,
    lessonsCount: course.lessons?.length || 0,
    selectedUnitId: selectedUnit?.id
  });

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
