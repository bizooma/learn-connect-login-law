
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, BookOpen, Clock, AlertTriangle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useSmartCompletion } from "@/hooks/useSmartCompletion";
import { logger } from "@/utils/logger";

type Unit = Tables<'units'>;

interface UnitCompletionRequirementsProps {
  unit: Unit;
  courseId: string;
  hasQuiz: boolean;
  refreshKey?: number;
}

const UnitCompletionRequirements = ({ 
  unit, 
  courseId, 
  hasQuiz, 
  refreshKey = 0 
}: UnitCompletionRequirementsProps) => {
  const { analyzeCompletionRequirements, checkCompletionStatus } = useSmartCompletion();
  const [status, setStatus] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const reqs = analyzeCompletionRequirements(unit, hasQuiz);
        const stat = await checkCompletionStatus(unit.id, courseId);
        setRequirements(reqs);
        setStatus(stat);
      } catch (error) {
        logger.error('Error initializing completion requirements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [unit.id, courseId, hasQuiz, refreshKey, analyzeCompletionRequirements, checkCompletionStatus]);

  if (loading) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">Loading completion requirements...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status || !requirements) {
    return null;
  }

  const getRequirementCard = () => {
    const isCompleted = status.overallCompleted;
    const cardClass = isCompleted ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200";
    const textClass = isCompleted ? "text-green-800" : "text-blue-800";

    if (isCompleted) {
      return (
        <Card className={cardClass}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm flex items-center ${textClass}`}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Unit Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-xs ${textClass}`}>
              You have successfully completed all requirements for this unit.
            </p>
          </CardContent>
        </Card>
      );
    }

    switch (requirements.completionStrategy) {
      case 'video_only':
        return (
          <Card className={cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center ${textClass}`}>
                <Play className="h-4 w-4 mr-2" />
                Video Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={`text-xs ${textClass} mb-2`}>
                Watch the video to complete this unit.
              </p>
              <Badge variant={status.videoCompleted ? "default" : "secondary"} className="text-xs">
                {status.videoCompleted ? 'Video Completed ✓' : 'Video Pending'}
              </Badge>
            </CardContent>
          </Card>
        );

      case 'quiz_only':
        return (
          <Card className={cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center ${textClass}`}>
                <BookOpen className="h-4 w-4 mr-2" />
                Quiz Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={`text-xs ${textClass} mb-2`}>
                Pass the quiz to complete this unit.
              </p>
              <Badge variant={status.quizCompleted ? "default" : "secondary"} className="text-xs">
                {status.quizCompleted ? 'Quiz Passed ✓' : 'Quiz Pending'}
              </Badge>
            </CardContent>
          </Card>
        );

      case 'video_and_quiz':
        const videoComplete = status.videoCompleted;
        const quizComplete = status.quizCompleted;
        const hasPartialProgress = videoComplete || quizComplete;
        
        return (
          <Card className={hasPartialProgress ? "bg-orange-50 border-orange-200" : cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center ${hasPartialProgress ? 'text-orange-800' : textClass}`}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Both Video & Quiz Required
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={`text-xs ${hasPartialProgress ? 'text-orange-800' : textClass} mb-3`}>
                Complete both the video and quiz to finish this unit.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Video:</span>
                  <Badge variant={videoComplete ? "default" : "secondary"} className="text-xs">
                    {videoComplete ? 'Completed ✓' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Quiz:</span>
                  <Badge variant={quizComplete ? "default" : "secondary"} className="text-xs">
                    {quizComplete ? 'Passed ✓' : 'Pending'}
                  </Badge>
                </div>
                {hasPartialProgress && (
                  <div className="pt-2 border-t border-orange-200">
                    <p className="text-xs text-orange-700 font-medium">
                      {videoComplete && !quizComplete && "Great! Now take the quiz to complete this unit."}
                      {!videoComplete && quizComplete && "Excellent! Now watch the video to complete this unit."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'manual_only':
        return (
          <Card className={cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm flex items-center ${textClass}`}>
                <Clock className="h-4 w-4 mr-2" />
                Manual Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={`text-xs ${textClass} mb-2`}>
                This unit requires manual completion by an instructor.
              </p>
              <Badge variant={status.manualCompleted ? "default" : "outline"} className="text-xs">
                {status.manualCompleted ? 'Manually Completed ✓' : 'Awaiting Completion'}
              </Badge>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return getRequirementCard();
};

export default UnitCompletionRequirements;
