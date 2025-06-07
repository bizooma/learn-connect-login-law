
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Loader2, Award, Video, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUnitProgress } from "@/hooks/useUnitProgress";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface UnitCompletionButtonProps {
  unit: Unit;
  courseId: string;
  onComplete?: () => void;
}

const UnitCompletionButton = ({ unit, courseId, onComplete }: UnitCompletionButtonProps) => {
  const { user } = useAuth();
  const { markUnitComplete } = useUserProgress(user?.id);
  const { isUnitCompleted, getUnitCompletedAt, markUnitComplete: updateLocalState } = useUnitProgress(courseId);
  const { videoProgress } = useVideoProgress(unit.id, courseId);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const isCompleted = isUnitCompleted(unit.id);
  const completedAt = getUnitCompletedAt(unit.id);
  const hasVideo = !!unit.video_url;

  const handleMarkComplete = async () => {
    if (!unit || !user) {
      toast({
        title: "Error",
        description: "Please log in to mark units as complete",
        variant: "destructive",
      });
      return;
    }
    
    setIsCompleting(true);
    try {
      console.log('Marking unit complete:', { unitId: unit.id, courseId, userId: user.id });
      await markUnitComplete(unit.id, courseId);
      
      // Update local state immediately for instant feedback
      updateLocalState(unit.id);
      
      toast({
        title: "Success",
        description: "Unit marked as complete! 🎉",
      });

      // Trigger completion check callback if provided
      if (onComplete) {
        onComplete();
      }

      // Small delay to let the course progress calculation complete
      setTimeout(() => {
        toast({
          title: "Course Progress Updated",
          description: "Check if your course is now complete for certificate download!",
          variant: "default",
        });
        
        // Trigger another completion check after delay
        if (onComplete) {
          onComplete();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error marking unit complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark unit as complete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Unit Completed</h3>
                <p className="text-sm text-green-600">
                  Great job! You completed this unit
                  {completedAt && (
                    <span className="ml-1">
                      on {new Date(completedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
                
                {/* Show completion details */}
                <div className="flex items-center space-x-4 mt-2">
                  {hasVideo && (
                    <div className="flex items-center space-x-1 text-xs">
                      <Video className="h-3 w-3" />
                      <span className={videoProgress.is_completed ? "text-green-600" : "text-gray-500"}>
                        Video: {videoProgress.is_completed ? "Watched" : `${videoProgress.watch_percentage}%`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-xs">
                    <BookOpen className="h-3 w-3" />
                    <span className="text-green-600">Unit: Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Complete Unit</h3>
            <p className="text-gray-600">Mark this unit as complete to track your progress.</p>
            
            {/* Show progress requirements */}
            {hasVideo && (
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-sm">
                  <Video className="h-4 w-4" />
                  <span className={videoProgress.is_completed ? "text-green-600" : "text-gray-500"}>
                    Video: {videoProgress.is_completed ? "✓ Watched" : `${videoProgress.watch_percentage}% watched`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <Button 
          onClick={handleMarkComplete}
          disabled={isCompleting || !user}
          className="flex items-center space-x-2 min-w-[140px]"
          variant={isCompleting ? "secondary" : "default"}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Completing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Mark Complete</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UnitCompletionButton;
