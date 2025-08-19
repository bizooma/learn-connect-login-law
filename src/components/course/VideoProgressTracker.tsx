
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
  const { videoProgress, loading } = useVideoProgress(unitId, courseId);
  const { completionState, forceComplete } = useVideoCompletion(unitId, courseId);
  
  // EMERGENCY FIX: Removed competing progress tracking that was causing video interruptions
  // Progress tracking is now handled exclusively by the YouTube player's built-in events

  // EMERGENCY FIX: Removed uploaded video progress tracking to prevent conflicts

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
