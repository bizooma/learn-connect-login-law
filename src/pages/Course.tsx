
import { useParams, useNavigate } from "react-router-dom";
import { useCourse } from "@/hooks/useCourse";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProgress } from "@/hooks/useUserProgress";
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

  console.log('Course: Component state:', {
    courseId,
    hasUser: !!user,
    authLoading,
    courseLoading: loading,
    hasCourse: !!course,
    error: error?.message || error,
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

    if (course && user) {
      console.log('Course: Updating course progress for user');
      updateCourseProgress(course.id, 'in_progress', 0);
    }
  }, [course, user, authLoading, isAdmin, navigate, updateCourseProgress]);

  // Set up real-time subscriptions for course content changes
  useEffect(() => {
    if (!courseId) return;

    console.log('Setting up real-time subscriptions for course:', courseId);

    // Subscribe to changes in modules, lessons, and units for this course
    const channel = supabase
      .channel(`course-${courseId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
          filter: `course_id=eq.${courseId}`
        },
        (payload) => {
          console.log('Module change detected:', payload);
          refreshCourse();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `course_id=eq.${courseId}`
        },
        (payload) => {
          console.log('Lesson change detected:', payload);
          refreshCourse();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units'
        },
        (payload) => {
          console.log('Unit change detected:', payload);
          // Check if this unit belongs to our course by refreshing
          refreshCourse();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [courseId, refreshCourse]);

  if (authLoading || loading) {
    console.log('Course: Showing loading state:', { authLoading, loading });
    return <CourseLoading />;
  }

  if (error || !course) {
    console.log('Course: Showing not found state:', { error, hasCourse: !!course });
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
