import { CheckCircle, AlertCircle, RefreshCw, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface VideoCompletionStatusProps {
  isCompleted: boolean;
  isProcessing: boolean;
  watchPercentage: number;
  completionAttempts: number;
  lastError: string | null;
  canManualOverride: boolean;
  onManualOverride: () => void;
  onRetry?: () => void;
}

const VideoCompletionStatus = ({
  isCompleted,
  isProcessing,
  watchPercentage,
  completionAttempts,
  lastError,
  canManualOverride,
  onManualOverride,
  onRetry
}: VideoCompletionStatusProps) => {
  // Don't show anything if video is completed successfully
  if (isCompleted && !lastError) {
    return (
      <div className="flex items-center space-x-2 text-success">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Video completed successfully!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Video Progress</span>
          <Badge variant={watchPercentage >= 95 ? "default" : "secondary"}>
            {Math.round(watchPercentage)}%
          </Badge>
        </div>
        <Progress value={watchPercentage} className="h-2" />
      </div>

      {/* Status Messages */}
      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Saving your video progress... (Attempt {completionAttempts})
          </AlertDescription>
        </Alert>
      )}

      {lastError && !isProcessing && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div>Failed to save video completion: {lastError}</div>
            {completionAttempts >= 2 && (
              <div className="text-xs text-muted-foreground">
                This may be a temporary issue. You can try the manual override below.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="flex space-x-2">
          {onRetry && lastError && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              disabled={isProcessing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </Button>
          )}
          
          {canManualOverride && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onManualOverride}
              disabled={isProcessing}
              className="flex items-center space-x-2"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Mark Complete</span>
            </Button>
          )}
        </div>
      )}

      {/* Help Text */}
      {watchPercentage >= 95 && !isCompleted && !isProcessing && (
        <div className="text-xs text-muted-foreground">
          You've watched {Math.round(watchPercentage)}% of this video. 
          {canManualOverride 
            ? " If completion is stuck, use the 'Mark Complete' button above."
            : " Completion should happen automatically."
          }
        </div>
      )}
    </div>
  );
};

export default VideoCompletionStatus;