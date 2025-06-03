
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<'quizzes'>;
type Question = Tables<'quiz_questions'>;
type QuestionOption = Tables<'quiz_question_options'>;

interface QuestionWithOptions extends Question {
  quiz_question_options: QuestionOption[];
}

interface QuizInterfaceProps {
  quiz: Quiz;
  unitTitle: string;
  onQuizComplete: (score: number, passed: boolean) => void;
}

const QuizInterface = ({ quiz, unitTitle, onQuizComplete }: QuizInterfaceProps) => {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [quiz.id]);

  useEffect(() => {
    if (quizStarted && quiz.time_limit_minutes && timeRemaining !== null) {
      if (timeRemaining <= 0) {
        handleSubmitQuiz();
        return;
      }

      const timer = setInterval(() => {
        setTimeRemaining(prev => prev !== null ? prev - 1 : null);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_question_options (*)
        `)
        .eq('quiz_id', quiz.id)
        .order('sort_order');

      if (error) throw error;

      const questionsWithOptions = data?.map(question => ({
        ...question,
        quiz_question_options: question.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order)
      })) || [];

      setQuestions(questionsWithOptions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive",
      });
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    try {
      let correctAnswers = 0;
      const totalQuestions = questions.length;

      questions.forEach(question => {
        const selectedOptionId = answers[question.id];
        if (selectedOptionId) {
          const selectedOption = question.quiz_question_options.find(opt => opt.id === selectedOptionId);
          if (selectedOption?.is_correct) {
            correctAnswers++;
          }
        }
      });

      const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = finalScore >= quiz.passing_score;

      setScore(finalScore);
      setQuizCompleted(true);
      onQuizComplete(finalScore, passed);

      toast({
        title: passed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${finalScore}%. ${passed ? 'Congratulations!' : `You need ${quiz.passing_score}% to pass.`}`,
        variant: passed ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-blue-700 text-sm">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Questions: {questions.length}</span>
            </div>
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
              onClick={startQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={questions.length === 0}
            >
              {questions.length === 0 ? 'Loading Questions...' : 'Start Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const passed = score >= quiz.passing_score;
    return (
      <Card className={`${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg flex items-center space-x-2 ${passed ? 'text-green-900' : 'text-red-900'}`}>
            {passed ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>Quiz {passed ? 'Passed' : 'Failed'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <p className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
              {passed ? 'Congratulations! You passed the quiz.' : `You need ${quiz.passing_score}% to pass. Please try again.`}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Questions Answered:</span>
              <div>{Object.keys(answers).length} / {questions.length}</div>
            </div>
            <div>
              <span className="font-medium">Passing Score:</span>
              <div>{quiz.passing_score}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading quiz questions...</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          {timeRemaining !== null && (
            <Badge variant={timeRemaining < 300 ? "destructive" : "secondary"}>
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          
          <div className="space-y-3">
            {currentQuestion.quiz_question_options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(currentQuestion.id, option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  answers[currentQuestion.id] === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.option_text}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestion.id] || loading}
          >
            {loading ? 'Submitting...' : 
             currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizInterface;
