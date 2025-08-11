
import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, RefreshCw } from "lucide-react";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoCompletion } from "@/hooks/useVideoCompletion";

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
  const { videoProgress, loading, updateVideoProgress } = useVideoProgress(unitId, courseId);
  const { completionState, handleVideoProgress, handleVideoEnded, forceComplete } = useVideoCompletion(unitId, courseId);
  const progressUpdateRef = useRef<number>();

  // Enhanced YouTube player event handling with better memory management
  useEffect(() => {
    if (videoType === 'youtube' && youtubePlayer) {
      let progressInterval: number | undefined;
      let hasTriggeredCompletion = false;

      const handleStateChange = (event: any) => {
        const state = event.data;
        
        if (state === 0 && !hasTriggeredCompletion) { // Video ended
          hasTriggeredCompletion = true;
          handleVideoEnded();
        } else if (state === 1) { // Playing
          // Clear any existing interval first
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          
          // Start optimized progress tracking (reduced frequency)
          progressInterval = window.setInterval(() => {
            try {
              const currentTime = youtubePlayer.getCurrentTime();
              const duration = youtubePlayer.getDuration();
              
              if (duration > 0) {
                const watchPercentage = (currentTime / duration) * 100;
                
                // Update both progress systems
                updateVideoProgress(currentTime, duration, watchPercentage);
                handleVideoProgress(currentTime, duration);
              }
            } catch (error) {
              console.warn('⚠️ Error tracking YouTube progress:', error);
            }
          }, 5000); // Reduced frequency: Update every 5 seconds
        } else {
          // Paused or other states - stop tracking
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = undefined;
          }
        }
      };

      // Enhanced error handling for YouTube events
      try {
        youtubePlayer.addEventListener('onStateChange', handleStateChange);
      } catch (error) {
        console.warn('⚠️ Error setting up YouTube progress tracking:', error);
      }

      return () => {
        try {
          youtubePlayer.removeEventListener('onStateChange', handleStateChange);
        } catch (error) {
          console.warn('⚠️ Error removing YouTube event listener:', error);
        }
        // Ensure interval is properly cleared
        if (progressInterval !== undefined) {
          clearInterval(progressInterval);
          progressInterval = undefined;
        }
      };
    }
  }, [youtubePlayer, videoType, updateVideoProgress, handleVideoProgress, handleVideoEnded, unitId]);

  // Enhanced regular video player event handling with debouncing
  useEffect(() => {
    const video = videoElement;
    if (!video || !unitId || videoType !== 'upload') return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0) {
        const watchPercentage = (currentTime / duration) * 100;
        
        // Debounce updates for better performance (increased delay)
        if (progressUpdateRef.current) {
          clearTimeout(progressUpdateRef.current);
        }
        progressUpdateRef.current = window.setTimeout(() => {
          updateVideoProgress(currentTime, duration, watchPercentage);
          handleVideoProgress(currentTime, duration);
        }, 5000); // Increased debounce time to 5 seconds
      }
    };

    const handleEnded = () => {
      handleVideoEnded();
    };

    // Enhanced event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      // Ensure timeout is properly cleared
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
        progressUpdateRef.current = undefined;
      }
    };
  }, [videoElement, videoType, updateVideoProgress, handleVideoProgress, handleVideoEnded, unitId]);

  // Show loading state or when no meaningful progress
  if (loading || (videoProgress.watch_percentage === 0 && videoProgress.watched_duration_seconds === 0)) {
    return null;
  }

  // Determine if video is actually completed (check both systems)
  const isVideoCompleted = videoProgress.is_completed || completionState.isCompleted;
  // Use the enhanced display percentage that shows 100% when completed
  const displayPercentage = videoProgress.displayPercentage || Math.max(videoProgress.watch_percentage, completionState.watchPercentage);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isVideoCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Play className="h-5 w-5 text-blue-600" />
          )}
          <h3 className="font-medium">
            {isVideoCompleted ? 'Video Completed' : 'Video Progress'}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isVideoCompleted ? "default" : "secondary"}>
            {Math.round(displayPercentage)}%
          </Badge>
          
          {/* Manual completion button for stuck videos */}
          {!isVideoCompleted && displayPercentage > 80 && (
            <Button
              onClick={forceComplete}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Mark Complete
            </Button>
          )}
        </div>
      </div>
      
      <Progress value={Math.round(displayPercentage)} className="h-2 mb-2" />
      
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
      
      {/* Enhanced completion status */}
      {isVideoCompleted && videoProgress.completed_at && (
        <p className="text-xs text-green-600 mt-2">
          ✅ Completed on {new Date(videoProgress.completed_at).toLocaleDateString()}
        </p>
      )}
      
      {/* Debug info for completion attempts */}
      {completionState.completionAttempts > 0 && !isVideoCompleted && (
        <p className="text-xs text-orange-600 mt-1">
          Completion attempts: {completionState.completionAttempts}
        </p>
      )}
    </div>
  );
};

export default VideoProgressTracker;
