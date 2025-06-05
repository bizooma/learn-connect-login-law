
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Award, RefreshCw } from "lucide-react";

interface QuizResultsProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
  onRetry?: () => void;
  onContinue: () => void;
}

const QuizResults = ({ 
  score, 
  correctAnswers, 
  totalQuestions, 
  passingScore, 
  onRetry, 
  onContinue 
}: QuizResultsProps) => {
  const passed = score >= passingScore;
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card className={`border-2 ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {passed ? (
              <Award className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {passed ? 'Congratulations!' : 'Quiz Complete'}
          </CardTitle>
          
          <div className="space-y-2">
            <div className="text-4xl font-bold">
              {score}%
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-sm">
              {passed ? 'PASSED' : 'FAILED'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-green-600">
                {correctAnswers}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-gray-700">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            Passing score: {passingScore}%
          </div>
          
          {passed ? (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                Great job! You've successfully completed this quiz.
              </p>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-medium">
                You need {passingScore}% to pass. Review the material and try again.
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            {!passed && onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Quiz
              </Button>
            )}
            
            <Button onClick={onContinue} className={passed ? 'bg-green-600 hover:bg-green-700' : ''}>
              {passed ? 'Continue Course' : 'Back to Course'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
