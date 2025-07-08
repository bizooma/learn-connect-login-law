
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, BookOpen, Clock, AlertCircle } from "lucide-react";
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
        <Badge variant="default" className={`flex items-center space-x-1 bg-green-600 ${className}`}>
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
            className={`flex items-center space-x-1 ${status.videoCompleted ? 'bg-green-600' : ''} ${className}`}
          >
            <Play className="h-3 w-3" />
            <span>{status.videoCompleted ? 'Video Complete' : 'Watch Video'}</span>
          </Badge>
        );

      case 'quiz_only':
        return (
          <Badge 
            variant={status.quizCompleted ? "default" : "secondary"} 
            className={`flex items-center space-x-1 ${status.quizCompleted ? 'bg-green-600' : ''} ${className}`}
          >
            <BookOpen className="h-3 w-3" />
            <span>{status.quizCompleted ? 'Quiz Passed' : 'Take Quiz'}</span>
          </Badge>
        );

      case 'video_and_quiz':
        const videoComplete = status.videoCompleted;
        const quizComplete = status.quizCompleted;
        const bothComplete = videoComplete && quizComplete;
        
        // Always show PROMINENT separate progress for video+quiz units
        return (
          <div className={`flex flex-col space-y-2 ${className}`}>
            {/* Main completion status */}
            <div className="flex items-center space-x-2">
              {bothComplete ? (
                <Badge variant="default" className="flex items-center space-x-1 bg-green-600 text-white">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-semibold">Unit Complete</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1 text-orange-600 border-orange-300 bg-orange-50">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold">Both Required</span>
                </Badge>
              )}
            </div>
            
            {/* Detailed progress indicators - ALWAYS visible and prominent */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={videoComplete ? "default" : "secondary"} 
                  className={`flex items-center space-x-1 ${videoComplete ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                >
                  <Play className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    Video {videoComplete ? '✓' : '○'}
                  </span>
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={quizComplete ? "default" : "secondary"} 
                  className={`flex items-center space-x-1 ${quizComplete ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                >
                  <BookOpen className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    Quiz {quizComplete ? '✓' : '○'}
                  </span>
                </Badge>
              </div>
            </div>
            
            {/* Helper text for next steps */}
            {!bothComplete && (
              <div className="text-xs text-gray-600">
                {!videoComplete && !quizComplete ? (
                  "Complete video and quiz to finish this unit"
                ) : !videoComplete ? (
                  "🎯 Next: Watch the video to complete this unit"
                ) : !quizComplete ? (
                  "🎯 Next: Take the quiz to complete this unit"
                ) : null}
              </div>
            )}
          </div>
        );

      case 'manual_only':
        return (
          <Badge 
            variant={status.manualCompleted ? "default" : "outline"} 
            className={`flex items-center space-x-1 ${status.manualCompleted ? 'bg-green-600' : ''} ${className}`}
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
