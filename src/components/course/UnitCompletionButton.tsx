
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useUnitProgress } from "@/hooks/useUnitProgress";
import { useUnifiedCompletion } from "@/hooks/useUnifiedCompletion";

type Unit = Tables<'units'>;

interface UnitCompletionButtonProps {
  unit: Unit;
  courseId: string;
  onComplete?: () => void;
}

const UnitCompletionButton = ({ unit, courseId, onComplete }: UnitCompletionButtonProps) => {
  const { isUnitCompleted } = useUnitProgress(courseId);
  const { markUnitComplete, processing } = useUnifiedCompletion();
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompleted = isUnitCompleted(unit.id);

  const handleManualComplete = async () => {
    if (isCompleting || processing) return;

    setIsCompleting(true);

    try {
      console.log('📝 Manual completion for unit:', unit.id);
      
      // Use the enhanced completion system with retry logic
      const success = await markUnitComplete(unit, courseId, 'manual');
      
      if (success && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('❌ Error in manual completion:', error);
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

    return (
      <>
        <Clock className="h-4 w-4 mr-2" />
        {isCompleting ? 'Completing...' : 'Mark as Complete'}
      </>
    );
  };

  const getButtonVariant = () => {
    if (isCompleted) {
      return "default";
    }
    return "outline";
  };

  const isButtonDisabled = () => {
    if (isCompleted) return true;
    if (isCompleting || processing) return true;
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Unit Progress</h3>
            <p className="text-gray-600 text-sm">
              Mark this unit as complete when you're finished with the content.
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
    </div>
  );
};

export default UnitCompletionButton;
