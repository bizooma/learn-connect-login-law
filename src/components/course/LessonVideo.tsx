
import { Tables } from "@/integrations/supabase/types";
import UnifiedVideoPlayer from "../video/UnifiedVideoPlayer";

type Lesson = Tables<'lessons'>;

interface LessonVideoProps {
  lesson: Lesson | null;
  courseId: string;
}

const LessonVideo = ({ lesson, courseId }: LessonVideoProps) => {
  if (!lesson?.video_url) {
    return null;
  }

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    console.log('Lesson video progress:', { currentTime, duration, watchPercentage });
    // TODO: Implement lesson video progress tracking if needed
  };

  const handleVideoComplete = () => {
    console.log('Lesson video completed');
    // TODO: Implement lesson video completion tracking if needed
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Lesson Video</h3>
      
      <UnifiedVideoPlayer
        videoUrl={lesson.video_url}
        title={lesson.title}
        onProgress={handleVideoProgress}
        onComplete={handleVideoComplete}
        className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
      />
      
      {lesson.duration_minutes && (
        <div className="mt-2 text-sm text-gray-600">
          Duration: {lesson.duration_minutes} minutes
        </div>
      )}
    </div>
  );
};

export default LessonVideo;
