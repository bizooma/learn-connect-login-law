
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Play, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUnitProgress } from "@/hooks/useUnitProgress";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useSmartCompletion } from "@/hooks/useSmartCompletion";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface UnitCompletionButtonProps {
  unit: Unit;
  courseId: string;
  onComplete?: () => void;
}

const UnitCompletionButton = ({ unit, courseId, onComplete }: UnitCompletionButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUnitCompleted } = useUnitProgress(courseId);
  const { videoProgress } = useVideoProgress(unit.id, courseId);
  const { analyzeCompletionRequirements, checkCompletionStatus } = useSmartCompletion();
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompleted = isUnitCompleted(unit.id);
  const requirements = analyzeCompletionRequirements(unit, false); // No quiz in this context

  const handleManualComplete = async () => {
    if (!user || isCompleting) return;

    setIsCompleting(true);

    try {
      console.log('Manual completion for unit:', unit.id);
      
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: unit.id,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          completion_method: 'manual',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        console.error('Error marking unit complete:', error);
        toast({
          title: "Error",
          description: "Failed to mark unit as complete. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Unit Completed! 🎉",
        description: "Great job! You've completed this unit.",
      });

      if (onComplete) {
        onComplete();
      }
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

  const getButtonContent = () => {
    if (isCompleted) {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Unit Completed
        </>
      );
    }

    switch (requirements.completionStrategy) {
      case 'video_only':
        if (videoProgress.is_completed) {
          return (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Video Completed
            </>
          );
        }
        return (
          <>
            <Play className="h-4 w-4 mr-2" />
            Watch Video to Complete ({videoProgress.watch_percentage}%)
          </>
        );

      case 'manual_only':
      default:
        return (
          <>
            <Clock className="h-4 w-4 mr-2" />
            {isCompleting ? 'Completing...' : 'Mark as Complete'}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    if (isCompleted || (requirements.completionStrategy === 'video_only' && videoProgress.is_completed)) {
      return "default";
    }
    return "outline";
  };

  const isButtonDisabled = () => {
    if (isCompleted) return true;
    if (isCompleting) return true;
    if (requirements.completionStrategy === 'video_only' && !videoProgress.is_completed) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Unit Progress</h3>
          <p className="text-gray-600 text-sm">
            {requirements.completionStrategy === 'video_only' 
              ? 'This unit will be completed automatically when you finish watching the video.'
              : 'Mark this unit as complete when you\'re finished with the content.'
            }
          </p>
        </div>
        
        <Button
          onClick={handleManualComplete}
          disabled={isButtonDisabled()}
          variant={getButtonVariant()}
          className="ml-4"
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};

export default UnitCompletionButton;
