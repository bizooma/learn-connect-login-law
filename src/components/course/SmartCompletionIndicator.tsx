
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, BookOpen, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useSmartCompletion } from "@/hooks/useSmartCompletion";

type Unit = Tables<'units'>;

interface SmartCompletionIndicatorProps {
  unit: Unit;
  courseId: string;
  hasQuiz: boolean;
  className?: string;
  refreshKey?: number;
}

const SmartCompletionIndicator = ({ 
  unit, 
  courseId, 
  hasQuiz, 
  className = "",
  refreshKey = 0
}: SmartCompletionIndicatorProps) => {
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
        console.error('Error initializing completion status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [unit.id, courseId, hasQuiz, refreshKey, analyzeCompletionRequirements, checkCompletionStatus]);

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </Badge>
      </div>
    );
  }

  if (!status || !requirements) {
    return null;
  }

  const getCompletionBadge = () => {
    if (status.overallCompleted) {
      return (
        <Badge variant="default" className={`flex items-center space-x-1 ${className}`}>
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      );
    }

    switch (requirements.completionStrategy) {
      case 'video_only':
        return (
          <Badge 
            variant={status.videoCompleted ? "default" : "secondary"} 
            className={`flex items-center space-x-1 ${className}`}
          >
            <Play className="h-3 w-3" />
            <span>{status.videoCompleted ? 'Video Complete' : 'Watch Video'}</span>
          </Badge>
        );

      case 'quiz_only':
        return (
          <Badge 
            variant={status.quizCompleted ? "default" : "secondary"} 
            className={`flex items-center space-x-1 ${className}`}
          >
            <BookOpen className="h-3 w-3" />
            <span>{status.quizCompleted ? 'Quiz Passed' : 'Take Quiz'}</span>
          </Badge>
        );

      case 'video_and_quiz':
        const bothComplete = status.videoCompleted && status.quizCompleted;
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <Badge 
              variant={status.videoCompleted ? "default" : "secondary"} 
              className="flex items-center space-x-1"
            >
              <Play className="h-3 w-3" />
              <span>Video</span>
            </Badge>
            <Badge 
              variant={status.quizCompleted ? "default" : "secondary"} 
              className="flex items-center space-x-1"
            >
              <BookOpen className="h-3 w-3" />
              <span>Quiz</span>
            </Badge>
            {bothComplete && (
              <Badge variant="default" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>Complete</span>
              </Badge>
            )}
          </div>
        );

      case 'manual_only':
        return (
          <Badge 
            variant={status.manualCompleted ? "default" : "outline"} 
            className={`flex items-center space-x-1 ${className}`}
          >
            <Clock className="h-3 w-3" />
            <span>Manual Completion</span>
          </Badge>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      {getCompletionBadge()}
    </div>
  );
};

export default SmartCompletionIndicator;
