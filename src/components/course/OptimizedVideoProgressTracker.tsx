import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, RefreshCw } from "lucide-react";
import { useUnifiedVideoPerformance } from "@/hooks/useUnifiedVideoPerformance";

interface OptimizedVideoProgressTrackerProps {
  unitId: string;
  courseId: string;
  videoElement?: HTMLVideoElement | null;
  youtubePlayer?: any;
  videoType?: 'upload' | 'youtube';
  enablePerformanceTracking?: boolean;
}

const OptimizedVideoProgressTracker = ({ 
  unitId, 
  courseId, 
  videoElement, 
  youtubePlayer,
  videoType = 'upload',
  enablePerformanceTracking = false
}: OptimizedVideoProgressTrackerProps) => {
  const {
    videoProgress,
    completionState,
    loading,
    isVideoCompleted,
    displayPercentage,
    forceComplete,
    performanceData
  } = useUnifiedVideoPerformance({
    unitId,
    courseId,
    videoElement,
    youtubePlayer,
    videoType,
    enablePerformanceTracking
  });

  // Early return for loading or no progress
  if (loading || (videoProgress.watch_percentage === 0 && videoProgress.watched_duration_seconds === 0)) {
    return null;
  }

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
      
      {/* Debug info for completion attempts (development only) */}
      {enablePerformanceTracking && completionState.completionAttempts > 0 && !isVideoCompleted && (
        <p className="text-xs text-orange-600 mt-1">
          Completion attempts: {completionState.completionAttempts}
        </p>
      )}

      {/* Performance monitoring (development only) */}
      {enablePerformanceTracking && performanceData && (
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
          <div>Intervals: {performanceData.totalIntervals}</div>
          <div>Timeouts: {performanceData.totalTimeouts}</div>
          <div>Event Listeners: {performanceData.totalEventListeners}</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedVideoProgressTracker;