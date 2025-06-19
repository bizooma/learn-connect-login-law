
import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play } from "lucide-react";
import { useVideoProgress } from "@/hooks/useVideoProgress";

interface VideoProgressTrackerProps {
  unitId: string;
  courseId: string;
  videoElement?: HTMLVideoElement | null;
  youtubePlayer?: any;
  videoType?: 'upload' | 'youtube';
}

const VideoProgressTracker = ({ 
  unitId, 
  courseId, 
  videoElement, 
  youtubePlayer,
  videoType = 'upload'
}: VideoProgressTrackerProps) => {
  const { videoProgress, updateVideoProgress } = useVideoProgress(unitId, courseId);
  const progressUpdateRef = useRef<number>();

  useEffect(() => {
    if (videoType === 'upload' && videoElement) {
      const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        if (duration > 0) {
          const watchPercentage = (currentTime / duration) * 100;
          
          // Throttle updates to every 3 seconds for better performance
          clearTimeout(progressUpdateRef.current);
          progressUpdateRef.current = window.setTimeout(() => {
            updateVideoProgress(currentTime, duration, watchPercentage);
          }, 3000);
        }
      };

      const handleEnded = () => {
        const duration = videoElement.duration;
        updateVideoProgress(duration, duration, 100);
      };

      const handleProgress = () => {
        // Also update on progress events (buffering, seeking)
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        if (duration > 0) {
          const watchPercentage = (currentTime / duration) * 100;
          updateVideoProgress(currentTime, duration, watchPercentage);
        }
      };

      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('progress', handleProgress);

      return () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('progress', handleProgress);
        clearTimeout(progressUpdateRef.current);
      };
    }
  }, [videoElement, videoType, updateVideoProgress]);

  useEffect(() => {
    if (videoType === 'youtube' && youtubePlayer) {
      let progressInterval: number;

      const handleStateChange = (event: any) => {
        const state = event.data;
        
        if (state === 0) { // Video ended
          try {
            const duration = youtubePlayer.getDuration();
            if (duration > 0) {
              updateVideoProgress(duration, duration, 100);
            }
          } catch (error) {
            console.warn('Error handling YouTube video end:', error);
          }
        } else if (state === 1) { // Playing
          // Start progress tracking
          progressInterval = window.setInterval(() => {
            try {
              const currentTime = youtubePlayer.getCurrentTime();
              const duration = youtubePlayer.getDuration();
              
              if (duration > 0) {
                const watchPercentage = (currentTime / duration) * 100;
                updateVideoProgress(currentTime, duration, watchPercentage);
              }
            } catch (error) {
              console.warn('Error tracking YouTube progress:', error);
            }
          }, 5000); // Update every 5 seconds
        } else {
          // Paused or other states - stop tracking
          if (progressInterval) {
            clearInterval(progressInterval);
          }
        }
      };

      try {
        youtubePlayer.addEventListener('onStateChange', handleStateChange);
      } catch (error) {
        console.warn('Error setting up YouTube progress tracking:', error);
      }

      return () => {
        try {
          youtubePlayer.removeEventListener('onStateChange', handleStateChange);
        } catch (error) {
          console.warn('Error removing YouTube event listener:', error);
        }
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      };
    }
  }, [youtubePlayer, videoType, updateVideoProgress]);

  if (videoProgress.watch_percentage === 0) {
    return null; // Don't show progress until user starts watching
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {videoProgress.is_completed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Play className="h-5 w-5 text-blue-600" />
          )}
          <h3 className="font-medium">
            {videoProgress.is_completed ? 'Video Completed' : 'Video Progress'}
          </h3>
        </div>
        <Badge variant={videoProgress.is_completed ? "default" : "secondary"}>
          {Math.round(videoProgress.watch_percentage)}%
        </Badge>
      </div>
      
      <Progress value={Math.round(videoProgress.watch_percentage)} className="h-2 mb-2" />
      
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {Math.floor(videoProgress.watched_duration_seconds / 60)}:
          {String(Math.floor(videoProgress.watched_duration_seconds % 60)).padStart(2, '0')}
        </span>
        {videoProgress.total_duration_seconds && (
          <span>
            {Math.floor(videoProgress.total_duration_seconds / 60)}:
            {String(Math.floor(videoProgress.total_duration_seconds % 60)).padStart(2, '0')}
          </span>
        )}
      </div>
      
      {videoProgress.is_completed && videoProgress.completed_at && (
        <p className="text-xs text-green-600 mt-2">
          Completed on {new Date(videoProgress.completed_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default VideoProgressTracker;
