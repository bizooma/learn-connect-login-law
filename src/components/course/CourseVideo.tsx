
import { useState, useRef, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import VideoProgressTracker from "./VideoProgressTracker";

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

  const isYouTube = unit.video_url.includes('youtube.com') || unit.video_url.includes('youtu.be');
  
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}` : url;
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
      
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(unit.video_url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={unit.title}
            onLoad={() => {
              // For YouTube Player API integration in future enhancement
              console.log('YouTube video loaded');
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={unit.video_url}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {unit.description && (
        <div className="mt-4">
          <p className="text-gray-700 break-words">{unit.description}</p>
        </div>
      )}
    </div>
  );
};

export default CourseVideo;
