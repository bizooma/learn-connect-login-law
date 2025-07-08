
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, CheckCircle, Users, XCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import QuizTaking from "../quiz/QuizTaking";
import QuizResults from "../quiz/QuizResults";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReliableCompletion } from "@/hooks/useReliableCompletion";
import { logger } from "@/utils/logger";

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
  onUnitComplete?: () => void;
}

interface QuizState {
  mode: 'preview' | 'taking' | 'results';
  score?: number;
  passed?: boolean;
  correctAnswers?: number;
  totalQuestions?: number;
}

interface QuizCompletionStatus {
  completed: boolean;
  passed: boolean;
  score: number;
  completedAt: string | null;
}

const QuizDisplay = ({ quiz, unitTitle, courseId, onUnitComplete }: QuizDisplayProps) => {
  const { user } = useAuth();
  const [quizState, setQuizState] = useState<QuizState>({ mode: 'preview' });
  const [quizWithQuestions, setQuizWithQuestions] = useState<QuizWithQuestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [completionStatus, setCompletionStatus] = useState<QuizCompletionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { evaluateAndCompleteUnit, updateCourseProgress } = useReliableCompletion();

  // Check quiz completion status
  const checkQuizCompletion = async () => {
    if (!user || !quiz.unit_id) {
      setStatusLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_unit_progress')
        .select('quiz_completed, quiz_completed_at')
        .eq('user_id', user.id)
        .eq('unit_id', quiz.unit_id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking quiz completion:', error);
        setCompletionStatus(null);
      } else if (data?.quiz_completed) {
        // For now, assume they passed if quiz_completed is true
        // In a full implementation, you might store the actual score
        setCompletionStatus({
          completed: true,
          passed: true,
          score: quiz.passing_score, // Default to passing score
          completedAt: data.quiz_completed_at
        });
      } else {
        setCompletionStatus({
          completed: false,
          passed: false,
          score: 0,
          completedAt: null
        });
      }
    } catch (error) {
      logger.error('Error checking quiz completion:', error);
      setCompletionStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkQuizCompletion();
  }, [user, quiz.unit_id, courseId]);

  const fetchQuizQuestions = async () => {
    if (!quiz.id) return;
    
    logger.log('QUIZ DISPLAY: Fetching questions for quiz:', quiz.id);
    setLoading(true);
    try {
      // First fetch questions without deleted ones
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true });

      if (questionsError) {
        logger.error('QUIZ DISPLAY: Error fetching questions:', questionsError);
        throw questionsError;
      }

      logger.log('QUIZ DISPLAY: Raw questions fetched:', questionsData?.length || 0);

      if (!questionsData || questionsData.length === 0) {
        logger.log('QUIZ DISPLAY: No questions found for quiz');
        setQuizWithQuestions({
          ...quiz,
          quiz_questions: []
        });
        return;
      }

      // Then fetch options for each question
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (question) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from('quiz_question_options')
            .select('*')
            .eq('question_id', question.id)
            .eq('is_deleted', false)
            .order('sort_order', { ascending: true });

          if (optionsError) {
            logger.warn(`QUIZ DISPLAY: Error fetching options for question ${question.id}:`, optionsError);
            return {
              ...question,
              quiz_question_options: []
            };
          }

          logger.log(`QUIZ DISPLAY: Found ${optionsData?.length || 0} options for question ${question.id}`);

          return {
            ...question,
            quiz_question_options: optionsData || []
          };
        })
      );

      const quizData: QuizWithQuestions = {
        ...quiz,
        quiz_questions: questionsWithOptions
      };

      logger.log('QUIZ DISPLAY: Final questions with options:', questionsWithOptions.length);
      setQuizWithQuestions(quizData);
    } catch (error) {
      logger.error('QUIZ DISPLAY: Error in fetchQuizQuestions:', error);
      setQuizWithQuestions(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch question count for preview display
  const fetchQuestionCount = async () => {
    if (!quiz.id) return;
    
    try {
      const { count, error } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id)
        .eq('is_deleted', false);

      if (error) {
        logger.warn('QUIZ DISPLAY: Error counting questions:', error);
        setQuestionCount(0);
      } else {
        setQuestionCount(count || 0);
      }
    } catch (error) {
      logger.warn('QUIZ DISPLAY: Error in fetchQuestionCount:', error);
      setQuestionCount(0);
    }
  };

  useEffect(() => {
    if (quiz.id && quizState.mode === 'taking') {
      fetchQuizQuestions();
    }
  }, [quiz.id, quizState.mode]);

  useEffect(() => {
    if (quiz.id && quizState.mode === 'preview') {
      fetchQuestionCount();
    }
  }, [quiz.id, quizState.mode]);

  const handleStartQuiz = () => {
    setQuizState({ mode: 'taking' });
  };

  const handleQuizComplete = async (passed: boolean, score: number) => {
    const totalQuestions = quizWithQuestions?.quiz_questions?.length || 0;
    const correctAnswers = Math.round((score / 100) * totalQuestions);
    
    logger.log('🎉 Quiz completed:', { passed, score, totalQuestions, unitId: quiz.unit_id });
    
    // Update completion status immediately
    setCompletionStatus({
      completed: true,
      passed,
      score,
      completedAt: new Date().toISOString()
    });
    
    setQuizState({ 
      mode: 'results',
      score,
      passed,
      correctAnswers,
      totalQuestions
    });

    // If quiz passed and we have a unit, evaluate unit completion
    if (passed && quiz.unit_id) {
      try {
        // We need the unit data to evaluate completion properly
        // For now, we'll just trigger the course progress update
        await updateCourseProgress(courseId);
        
        if (onUnitComplete) {
          onUnitComplete();
        }
      } catch (error) {
        logger.error('❌ Error evaluating unit completion after quiz:', error);
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizState({ mode: 'taking' });
  };

  const handleBackToCourse = () => {
    setQuizState({ mode: 'preview' });
    // Refresh completion status
    checkQuizCompletion();
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

    if (!quizWithQuestions || quizWithQuestions.quiz_questions.length === 0) {
      return (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <p className="text-yellow-800">This quiz has no questions available.</p>
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

  if (statusLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Checking quiz status...</p>
        </CardContent>
      </Card>
    );
  }

  // Show completion status if quiz is already completed
  if (completionStatus?.completed) {
    const cardClass = completionStatus.passed 
      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
      : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200";
    
    return (
      <Card className={cardClass}>
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
          <div className="text-center">
            {completionStatus.passed ? (
              <div className="flex flex-col items-center space-y-2">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div className="text-lg font-semibold text-green-800">Quiz Passed!</div>
                <div className="text-sm text-green-700">
                  Score: {completionStatus.score}% (Passing: {quiz.passing_score}%)
                </div>
                {completionStatus.completedAt && (
                  <div className="text-xs text-green-600">
                    Completed on {new Date(completionStatus.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <XCircle className="h-12 w-12 text-red-600" />
                <div className="text-lg font-semibold text-red-800">Quiz Failed</div>
                <div className="text-sm text-red-700">
                  Score: {completionStatus.score}% (Need: {quiz.passing_score}%)
                </div>
                <Button 
                  onClick={handleRetryQuiz}
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  Retake Quiz
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show normal preview for uncompleted quiz
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
            <Users className="h-4 w-4 text-blue-600" />
            <span>Questions: {questionCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
          {quiz.time_limit_minutes && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Time Limit: {quiz.time_limit_minutes} minutes</span>
            </div>
          )}
        </div>

        <Button onClick={handleStartQuiz} className="w-full">
          Start Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizDisplay;
