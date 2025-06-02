
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<'quizzes'>;

interface QuizDisplayProps {
  quiz: Quiz;
  unitTitle: string;
}

const QuizDisplay = ({ quiz, unitTitle }: QuizDisplayProps) => {
  const [quizStarted, setQuizStarted] = useState(false);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    // TODO: Implement quiz taking functionality
    console.log('Starting quiz:', quiz.id);
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">{quiz.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Quiz
          </Badge>
        </div>
        {quiz.description && (
          <p className="text-blue-700 text-sm">{quiz.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
          {quiz.time_limit_minutes && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>Time Limit: {quiz.time_limit_minutes} minutes</span>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleStartQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!quiz.is_active}
          >
            {quiz.is_active ? 'Start Quiz' : 'Quiz Not Available'}
          </Button>
        </div>
        
        {quizStarted && (
          <div className="text-center text-sm text-gray-600 mt-2">
            Quiz functionality will be implemented in a future update.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizDisplay;
