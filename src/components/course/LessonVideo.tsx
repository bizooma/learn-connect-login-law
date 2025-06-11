
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Play, Pause } from "lucide-react";

type Lesson = Tables<'lessons'>;

interface LessonVideoProps {
  lesson: Lesson | null;
  courseId: string;
}

const LessonVideo = ({ lesson, courseId }: LessonVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!lesson?.video_url) {
    return null;
  }

  const isYouTube = lesson.video_type === 'youtube' || 
    lesson.video_url.includes('youtube.com') || 
    lesson.video_url.includes('youtu.be');

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}?modestbranding=1&rel=0&showinfo=0&controls=1&disablekb=0&fs=1&iv_load_policy=3`;
    }
    return url;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Lesson Video</h3>
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(lesson.video_url)}
            title={lesson.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={lesson.video_url}
              controls
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all"
                >
                  <Play className="h-8 w-8 text-gray-800" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {lesson.duration_minutes && (
        <div className="mt-2 text-sm text-gray-600">
          Duration: {lesson.duration_minutes} minutes
        </div>
      )}
    </div>
  );
};

export default LessonVideo;
