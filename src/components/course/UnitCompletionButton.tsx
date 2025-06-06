
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUnitProgress } from "@/hooks/useUnitProgress";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface UnitCompletionButtonProps {
  unit: Unit;
  courseId: string;
}

const UnitCompletionButton = ({ unit, courseId }: UnitCompletionButtonProps) => {
  const { user } = useAuth();
  const { markUnitComplete } = useUserProgress(user?.id);
  const { isUnitCompleted, getUnitCompletedAt, markUnitComplete: updateLocalState } = useUnitProgress(courseId);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const isCompleted = isUnitCompleted(unit.id);
  const completedAt = getUnitCompletedAt(unit.id);

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
