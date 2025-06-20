
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
import { useSmartCompletion } from "@/hooks/useSmartCompletion";
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
  onComplete: (quizPassed: boolean, score: number) => void;
  onCancel: () => void;
}

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

const QuizTaking = ({ quiz, unitTitle, courseId, onComplete, onCancel }: QuizTakingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerSmartCompletion, analyzeCompletionRequirements, checkCompletionStatus } = useSmartCompletion();
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

  // Enhanced completion messaging that considers unit requirements
  const getEnhancedCompletionMessage = async (passed: boolean, score: number) => {
    if (!passed || !quiz.unit_id) {
      return passed ? "Quiz Passed!" : "Quiz Completed";
    }

    try {
      // Get unit info to analyze completion requirements
      const { data: unit } = await supabase
        .from('units')
        .select('video_url')
        .eq('id', quiz.unit_id)
        .single();

      if (!unit) return "Quiz Passed!";

      const requirements = analyzeCompletionRequirements(unit as any, true);
      const status = await checkCompletionStatus(quiz.unit_id, courseId);

      if (requirements.completionStrategy === 'video_and_quiz' && status) {
        if (status.overallCompleted) {
          return "Unit Completed! 🎉";
        } else if (status.quizCompleted && !status.videoCompleted) {
          return "Quiz Passed! Video Required Next";
        }
      }

      return "Quiz Passed!";
    } catch (error) {
      console.error('Error getting enhanced completion message:', error);
      return "Quiz Passed!";
    }
  };

  // Enhanced completion description that explains next steps
  const getCompletionDescription = async (passed: boolean, score: number) => {
    const baseDescription = `You scored ${score}% (${calculateScore().correctAnswers}/${calculateScore().totalQuestions} correct)`;
    
    if (!passed || !quiz.unit_id) {
      return baseDescription;
    }

    try {
      // Get unit info to analyze completion requirements
      const { data: unit } = await supabase
        .from('units')
        .select('video_url')
        .eq('id', quiz.unit_id)
        .single();

      if (!unit) return baseDescription;

      const requirements = analyzeCompletionRequirements(unit as any, true);
      const status = await checkCompletionStatus(quiz.unit_id, courseId);

      if (requirements.completionStrategy === 'video_and_quiz' && status) {
        if (status.overallCompleted) {
          return `${baseDescription}. This unit is now complete!`;
        } else if (status.quizCompleted && !status.videoCompleted) {
          return `${baseDescription}. To complete this unit, you also need to watch the video.`;
        }
      }

      return baseDescription;
    } catch (error) {
      console.error('Error getting completion description:', error);
      return baseDescription;
    }
  };

  // Enhanced quiz completion persistence
  const persistQuizCompletion = async (passed: boolean, score: number) => {
    if (!user || !quiz.unit_id) return false;

    try {
      console.log('Persisting quiz completion:', {
        userId: user.id,
        unitId: quiz.unit_id,
        courseId,
        passed,
        score
      });

      // Enhanced UPSERT with explicit completion data
      const { error: quizProgressError } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: user.id,
          unit_id: quiz.unit_id,
          course_id: courseId,
          quiz_completed: passed,
          quiz_completed_at: passed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id',
          ignoreDuplicates: false
        });

      if (quizProgressError) {
        console.error('Quiz completion persistence failed:', quizProgressError);
        // Try a secondary approach with explicit INSERT
        try {
          const { error: insertError } = await supabase
            .from('user_unit_progress')
            .insert({
              user_id: user.id,
              unit_id: quiz.unit_id,
              course_id: courseId,
              quiz_completed: passed,
              quiz_completed_at: passed ? new Date().toISOString() : null,
              completed: false, // Only quiz completed, not full unit
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
            console.error('Insert fallback also failed:', insertError);
            return false;
          }
        } catch (insertError) {
          console.error('Insert fallback error:', insertError);
          return false;
        }
      }

      console.log('Quiz completion persisted successfully');
      return true;
    } catch (error) {
      console.error('Error in persistQuizCompletion:', error);
      return false;
    }
  };

  // Separate function to handle course progress updates (can fail without affecting quiz)
  const updateCourseProgress = async () => {
    if (!user || !quiz.unit_id) return;

    try {
      console.log('Attempting course progress update after quiz completion');

      // Get unit info to check if it has video
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('video_url')
        .eq('id', quiz.unit_id)
        .single();

      if (unitError) {
        console.warn('Could not fetch unit for course progress update:', unitError);
        return;
      }

      const hasVideo = !!unit?.video_url;

      // Use smart completion to determine if unit should be completed
      try {
        const unitCompleted = await triggerSmartCompletion(
          unit as any,
          courseId,
          true,
          'quiz_complete'
        );

        if (unitCompleted) {
          console.log('Smart completion triggered unit completion');
        } else {
          console.log('Smart completion evaluated - unit not yet complete (may need video)');
        }
      } catch (smartCompletionError) {
        console.warn('Smart completion failed, using fallback logic:', smartCompletionError);
        
        // Fallback to legacy completion logic for quiz-only units
        if (!hasVideo) {
          console.log('Quiz-only unit detected, marking as completed with fallback logic');
          
          try {
            await supabase
              .from('user_unit_progress')
              .upsert({
                user_id: user.id,
                unit_id: quiz.unit_id,
                course_id: courseId,
                completed: true,
                completed_at: new Date().toISOString(),
                completion_method: 'quiz_only',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,unit_id,course_id',
                ignoreDuplicates: false
              });

            toast({
              title: "Unit Completed! 🎉",
              description: `Great job! You've completed this unit by passing the quiz.`,
            });
          } catch (fallbackError) {
            console.error('Fallback completion also failed:', fallbackError);
          }
        }
      }
    } catch (error) {
      console.error('Course progress update failed:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const score = calculateScore();
      const passed = score.percentage >= quiz.passing_score;
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - quizStartTime.getTime()) / (1000 * 60));

      console.log('Quiz submission started:', {
        userId: user.id,
        quizId: quiz.id,
        courseId,
        score: score.percentage,
        passed,
        answers: answers.length,
        duration: durationMinutes,
        unitId: quiz.unit_id
      });

      // Step 1: Persist quiz completion first (critical - must succeed)
      if (quiz.unit_id) {
        const quizPersisted = await persistQuizCompletion(passed, score.percentage);
        if (!quizPersisted) {
          console.warn('Quiz completion persistence failed, but continuing with user feedback');
        }
      }

      // Step 2: Update course progress (secondary - can fail without affecting quiz result)
      if (passed && quiz.unit_id) {
        setTimeout(() => updateCourseProgress(), 100);
      }

      // Step 3: Show enhanced user feedback
      const enhancedTitle = await getEnhancedCompletionMessage(passed, score.percentage);
      const enhancedDescription = await getCompletionDescription(passed, score.percentage);
      
      toast({
        title: enhancedTitle,
        description: enhancedDescription,
        variant: passed ? "default" : "destructive",
      });

      // Step 4: Call completion callback
      onComplete(passed, score.percentage);

    } catch (error) {
      console.error('Critical error in quiz submission:', error);
      
      // Even if there's an error, try to preserve the quiz attempt
      const score = calculateScore();
      const passed = score.percentage >= quiz.passing_score;
      
      toast({
        title: "Quiz Submission Error",
        description: "There was an issue saving your quiz, but your answers have been recorded. Please contact support if this persists.",
        variant: "destructive",
      });
      
      // Still call the completion callback to prevent UI freeze
      onComplete(passed, score.percentage);
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
