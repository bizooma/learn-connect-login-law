
import { useEffect, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, RefreshCw } from "lucide-react";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoCompletion } from "@/hooks/useVideoCompletion";
import { logger } from "@/utils/logger";

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
  const youtubeIntervalRef = useRef<number>();
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Enhanced YouTube player event handling with proper cleanup
  useEffect(() => {
    if (videoType === 'youtube' && youtubePlayer) {
      let hasTriggeredCompletion = false;

      const handleStateChange = (event: any) => {
        const state = event.data;
        logger.log('🎵 YouTube state change:', state, 'for unit:', unitId);
        
        if (state === 0 && !hasTriggeredCompletion) { // Video ended
          hasTriggeredCompletion = true;
          logger.log('🎯 YouTube video ended - triggering completion');
          handleVideoEnded();
        } else if (state === 1) { // Playing
          // Clear any existing interval first
          if (youtubeIntervalRef.current) {
            clearInterval(youtubeIntervalRef.current);
          }
          
          // Start optimized progress tracking
          youtubeIntervalRef.current = window.setInterval(() => {
            try {
              const currentTime = youtubePlayer.getCurrentTime();
              const duration = youtubePlayer.getDuration();
              
              if (duration > 0) {
                const watchPercentage = (currentTime / duration) * 100;
                
                // Batch updates for better performance
                updateVideoProgress(currentTime, duration, watchPercentage);
                handleVideoProgress(currentTime, duration);
              }
            } catch (error) {
              logger.warn('⚠️ Error tracking YouTube progress:', error);
              // Clear interval on error to prevent memory leaks
              if (youtubeIntervalRef.current) {
                clearInterval(youtubeIntervalRef.current);
                youtubeIntervalRef.current = undefined;
              }
            }
          }, 3000);
        } else {
          // Paused or other states - stop tracking
          if (youtubeIntervalRef.current) {
            clearInterval(youtubeIntervalRef.current);
            youtubeIntervalRef.current = undefined;
          }
        }
      };

      // Enhanced error handling for YouTube events
      try {
        youtubePlayer.addEventListener('onStateChange', handleStateChange);
        cleanupFunctionsRef.current.push(() => {
          try {
            youtubePlayer.removeEventListener('onStateChange', handleStateChange);
          } catch (error) {
            logger.warn('⚠️ Error removing YouTube event listener:', error);
          }
        });
      } catch (error) {
        logger.warn('⚠️ Error setting up YouTube progress tracking:', error);
      }

      return () => {
        // Comprehensive cleanup
        if (youtubeIntervalRef.current) {
          clearInterval(youtubeIntervalRef.current);
          youtubeIntervalRef.current = undefined;
        }
        
        // Execute all cleanup functions
        cleanupFunctionsRef.current.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            logger.warn('⚠️ Error during cleanup:', error);
          }
        });
        cleanupFunctionsRef.current = [];
      };
    }
  }, [youtubePlayer, videoType, updateVideoProgress, handleVideoProgress, handleVideoEnded, unitId]);

  // Enhanced regular video player event handling with memory optimization
  useEffect(() => {
    const video = videoElement;
    if (!video || !unitId || videoType !== 'upload') return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0) {
        const watchPercentage = (currentTime / duration) * 100;
        
        // Optimized throttling with cleanup
        if (progressUpdateRef.current) {
          clearTimeout(progressUpdateRef.current);
        }
        
        progressUpdateRef.current = window.setTimeout(() => {
          try {
            updateVideoProgress(currentTime, duration, watchPercentage);
            handleVideoProgress(currentTime, duration);
          } catch (error) {
            logger.warn('⚠️ Error updating video progress:', error);
          }
        }, 2000);
      }
    };

    const handleEnded = () => {
      logger.log('🎯 Regular video ended - triggering completion');
      handleVideoEnded();
    };

    // Add event listeners with passive option for better performance
    video.addEventListener('timeupdate', handleTimeUpdate, { passive: true });
    video.addEventListener('ended', handleEnded, { passive: true });

    // Store cleanup functions
    const cleanup = () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
        progressUpdateRef.current = undefined;
      }
    };
    
    cleanupFunctionsRef.current.push(cleanup);

    return cleanup;
  }, [videoElement, videoType, updateVideoProgress, handleVideoProgress, handleVideoEnded, unitId]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals and timeouts
      if (youtubeIntervalRef.current) {
        clearInterval(youtubeIntervalRef.current);
      }
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
      }
      
      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.warn('⚠️ Error during global cleanup:', error);
        }
      });
    };
  }, []);

  // Show loading state or when no meaningful progress
  if (loading || (videoProgress.watch_percentage === 0 && videoProgress.watched_duration_seconds === 0)) {
    return null;
  }

  // Determine if video is actually completed (check both systems)
  const isVideoCompleted = videoProgress.is_completed || completionState.isCompleted;
  const displayPercentage = Math.max(videoProgress.watch_percentage, completionState.watchPercentage);

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
