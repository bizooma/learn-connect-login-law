
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<'quizzes'>;
type Question = Tables<'quiz_questions'>;
type Option = Tables<'quiz_question_options'>;

interface QuestionWithOptions extends Question {
  quiz_question_options: Option[];
}

interface QuizWithQuestions extends Quiz {
  quiz_questions: QuestionWithOptions[];
}

interface QuizTakingProps {
  quiz: QuizWithQuestions;
  unitTitle: string;
  courseId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

const QuizTaking = ({ quiz, unitTitle, courseId, onComplete, onCancel }: QuizTakingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime] = useState(new Date());

  const questions = quiz.quiz_questions?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Initialize timer if quiz has time limit
  useEffect(() => {
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  }, [quiz.time_limit_minutes]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionId: string) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.id);
    
    if (existingAnswerIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = { questionId: currentQuestion.id, selectedOptionId: optionId };
      setAnswers(newAnswers);
    } else {
      setAnswers([...answers, { questionId: currentQuestion.id, selectedOptionId: optionId }]);
    }
  };

  const getCurrentAnswer = () => {
    return answers.find(a => a.questionId === currentQuestion.id)?.selectedOptionId || '';
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      
      if (userAnswer) {
        const selectedOption = question.quiz_question_options.find(
          option => option.id === userAnswer.selectedOptionId
        );
        
        if (selectedOption?.is_correct) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return { correctAnswers, totalQuestions, earnedPoints, totalPoints, percentage };
  };

  const handleSubmitQuiz = async () => {
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const score = calculateScore();
      const passed = score.percentage >= quiz.passing_score;
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - quizStartTime.getTime()) / (1000 * 60));

      // Save quiz attempt (you might want to create a quiz_attempts table)
      console.log('Quiz completed:', {
        userId: user.id,
        quizId: quiz.id,
        courseId,
        score: score.percentage,
        passed,
        answers: answers.length,
        duration: durationMinutes
      });

      toast({
        title: passed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${score.percentage}% (${score.correctAnswers}/${score.totalQuestions} correct)`,
        variant: passed ? "default" : "destructive",
      });

      // If quiz passed, mark unit as complete
      if (passed && quiz.unit_id) {
        await supabase
          .from('user_unit_progress')
          .upsert({
            user_id: user.id,
            unit_id: quiz.unit_id,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,unit_id,course_id'
          });
      }

      onComplete();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = answers.length === totalQuestions;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  if (totalQuestions === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6 text-center">
          <p className="text-yellow-800">This quiz has no questions available.</p>
          <Button onClick={onCancel} className="mt-4">Back to Course</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              <p className="text-gray-600 mt-1">{unitTitle}</p>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-lg font-mono">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? "text-red-600" : "text-gray-600"}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              <span>Passing Score: {quiz.passing_score}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question_text}
          </CardTitle>
          <p className="text-sm text-gray-500">{currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}</p>
        </CardHeader>
        <CardContent>
          <RadioGroup value={getCurrentAnswer()} onValueChange={handleAnswerSelect}>
            {currentQuestion.quiz_question_options
              ?.sort((a, b) => a.sort_order - b.sort_order)
              .map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.option_text}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel Quiz
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!canSubmit || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!getCurrentAnswer()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Answer Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress:</span>
            <span className="text-sm font-medium">
              {answers.length} of {totalQuestions} answered
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {questions.map((_, index) => {
              const hasAnswer = answers.some(a => a.questionId === questions[index].id);
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <Button
                  key={index}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  className={`w-10 h-10 ${hasAnswer ? 'bg-green-100 border-green-300' : ''}`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {hasAnswer && <CheckCircle className="h-3 w-3" />}
                  {!hasAnswer && <span>{index + 1}</span>}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaking;
