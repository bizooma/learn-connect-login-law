
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import QuizTaking from "../quiz/QuizTaking";
import QuizResults from "../quiz/QuizResults";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

type Quiz = Tables<'quizzes'>;
type Question = Tables<'quiz_questions'>;
type Option = Tables<'quiz_question_options'>;

interface QuestionWithOptions extends Question {
  quiz_question_options: Option[];
}

interface QuizWithQuestions extends Quiz {
  quiz_questions: QuestionWithOptions[];
}

interface QuizDisplayProps {
  quiz: Quiz;
  unitTitle: string;
  courseId: string;
}

interface QuizState {
  mode: 'preview' | 'taking' | 'results';
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

const QuizDisplay = ({ quiz, unitTitle, courseId }: QuizDisplayProps) => {
  const [quizState, setQuizState] = useState<QuizState>({ mode: 'preview' });
  const [quizWithQuestions, setQuizWithQuestions] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuizQuestions = async () => {
    if (!quiz.id) return;
    
    setLoading(true);
    try {
      const { data: questions, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_question_options (*)
        `)
        .eq('quiz_id', quiz.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const quizData: QuizWithQuestions = {
        ...quiz,
        quiz_questions: questions.map(q => ({
          ...q,
          quiz_question_options: q.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order)
        }))
      };

      setQuizWithQuestions(quizData);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quiz.id && quizState.mode === 'taking') {
      fetchQuizQuestions();
    }
  }, [quiz.id, quizState.mode]);

  const handleStartQuiz = () => {
    setQuizState({ mode: 'taking' });
  };

  const handleQuizComplete = () => {
    // This would normally get the actual results from the quiz taking component
    // For now, we'll show a placeholder
    setQuizState({ 
      mode: 'results',
      score: 85,
      correctAnswers: 8,
      totalQuestions: 10
    });
  };

  const handleRetryQuiz = () => {
    setQuizState({ mode: 'taking' });
  };

  const handleBackToCourse = () => {
    setQuizState({ mode: 'preview' });
  };

  if (quizState.mode === 'taking') {
    if (loading) {
      return (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading quiz questions...</p>
          </CardContent>
        </Card>
      );
    }

    if (!quizWithQuestions) {
      return (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <p className="text-yellow-800">Unable to load quiz questions.</p>
            <Button onClick={() => setQuizState({ mode: 'preview' })} className="mt-4">
              Back to Quiz Info
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <QuizTaking
        quiz={quizWithQuestions}
        unitTitle={unitTitle}
        courseId={courseId}
        onComplete={handleQuizComplete}
        onCancel={handleBackToCourse}
      />
    );
  }

  if (quizState.mode === 'results') {
    return (
      <QuizResults
        score={quizState.score || 0}
        correctAnswers={quizState.correctAnswers || 0}
        totalQuestions={quizState.totalQuestions || 0}
        passingScore={quiz.passing_score}
        onRetry={handleRetryQuiz}
        onContinue={handleBackToCourse}
      />
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Questions: Loading...</span>
          </div>
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
        
        {!quiz.is_active && (
          <div className="text-center text-sm text-gray-600 mt-2">
            This quiz is currently disabled.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizDisplay;
