
import { Progress } from "@/components/ui/progress";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

type Lesson = Tables<'lessons'> & {
  units: Tables<'units'>[];
};

interface CourseProgressBarProps {
  courseId: string;
  lessons: Lesson[];
}

const CourseProgressBar = ({ courseId, lessons }: CourseProgressBarProps) => {
  const { user } = useAuth();
  const { courseProgress } = useUserProgress(user?.id);

  // Find progress for this specific course
  const currentCourseProgress = courseProgress.find(course => course.id === courseId);
  const progressPercentage = currentCourseProgress?.progress?.progress_percentage || 0;

  // Calculate total lessons and units for display
  const totalLessons = lessons.length;
  const totalUnits = lessons.reduce((acc, lesson) => acc + lesson.units.length, 0);

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Course Progress</h3>
        <span className="text-sm text-gray-500">{progressPercentage}% Complete</span>
      </div>
      
      <Progress value={progressPercentage} className="h-3 mb-2" />
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{totalLessons} lessons</span>
        <span>{totalUnits} units total</span>
      </div>
    </div>
  );
};

export default CourseProgressBar;
