
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useReliableCompletion } from "@/hooks/useReliableCompletion";
import { logger } from "@/utils/logger";

type Quiz = Tables<'quizzes'> & {
  quiz_questions: Array<Tables<'quiz_questions'> & {
    quiz_question_options: Tables<'quiz_question_options'>[];
  }>;
};

interface QuizTakingProps {
  quiz: Quiz;
  unitTitle: string;
  courseId: string;
  onComplete: (passed: boolean, score: number) => void;
  onCancel: () => void;
}

const QuizTaking = ({ quiz, unitTitle, courseId, onComplete, onCancel }: QuizTakingProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markQuizComplete, evaluateAndCompleteUnit } = useReliableCompletion();

  const questions = quiz.quiz_questions || [];
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  if (totalQuestions === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-6 text-center">
          <p className="text-yellow-800">This quiz has no questions available.</p>
          <Button onClick={onCancel} className="mt-4">
            Back to Unit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      logger.log('📝 Submitting quiz:', quiz.id);
      
      // Calculate score
      let correctAnswers = 0;
      
      questions.forEach(question => {
        const selectedOptionId = answers[question.id];
        const correctOption = question.quiz_question_options.find(opt => opt.is_correct);
        
        if (selectedOptionId === correctOption?.id) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= quiz.passing_score;
      
      logger.log('📊 Quiz results:', { score, passed, correctAnswers, totalQuestions });

      if (passed && quiz.unit_id) {
        logger.log('✅ Quiz passed, marking quiz complete and evaluating unit');
        
        // Mark quiz as completed
        await markQuizComplete(quiz.unit_id, courseId);
        
        // Evaluate if unit should be completed
        // Note: We'll need the unit data for this, but for now we'll trigger the completion
        // The evaluateAndCompleteUnit will be called from the parent component
      }

      onComplete(passed, score);
    } catch (error) {
      logger.error('❌ Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const allQuestionsAnswered = questions.every(q => answers[q.id]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-900">{quiz.title}</CardTitle>
              <p className="text-blue-700 text-sm mt-1">Unit: {unitTitle}</p>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Question {currentQuestion + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            {currentQuestionData.question_text}
          </p>

          <RadioGroup
            value={answers[currentQuestionData.id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestionData.id, value)}
          >
            {currentQuestionData.quiz_question_options
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label 
                    htmlFor={option.id} 
                    className="text-gray-700 cursor-pointer flex-1"
                  >
                    {option.option_text}
                  </Label>
                </div>
              ))}
          </RadioGroup>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel Quiz
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Quiz'}</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestionData.id]}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaking;
