
import { useState, useRef, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import VideoProgressTracker from "./VideoProgressTracker";
import UnifiedVideoPlayer from "../video/UnifiedVideoPlayer";
import { isYouTubeUrl } from "@/utils/youTubeUtils";

type Unit = Tables<'units'>;

interface CourseVideoProps {
  unit: Unit | null;
  courseId: string;
}

const CourseVideo = ({ unit, courseId }: CourseVideoProps) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current);
    }
  }, [unit?.video_url]);

  if (!unit?.video_url) {
    return null;
  }

  const isYouTube = isYouTubeUrl(unit.video_url);

  const handleVideoProgress = (currentTime: number, duration: number, watchPercentage: number) => {
    // This will be handled by the VideoProgressTracker through the new progress system
    console.log('Video progress:', { currentTime, duration, watchPercentage });
  };

  const handleVideoComplete = () => {
    console.log('Video completed');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 break-words">{unit.title}</h3>
      
      {/* Video Progress Tracker */}
      <VideoProgressTracker
        unitId={unit.id}
        courseId={courseId}
        videoElement={videoElement}
        youtubePlayer={youtubePlayer}
        videoType={isYouTube ? 'youtube' : 'upload'}
      />
      
      <UnifiedVideoPlayer
        videoUrl={unit.video_url}
        title={unit.title}
        onProgress={handleVideoProgress}
        onComplete={handleVideoComplete}
        className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
        autoLoad={true}
      />
      
      {unit.description && (
        <div className="mt-4">
          <p className="text-gray-700 break-words">{unit.description}</p>
        </div>
      )}
    </div>
  );
};

export default CourseVideo;
