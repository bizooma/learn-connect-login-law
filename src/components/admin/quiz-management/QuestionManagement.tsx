
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import CreateQuestionForm from "./CreateQuestionForm";
import EditQuestionForm from "./EditQuestionForm";
import { logger } from "@/utils/logger";

type QuizQuestion = Tables<'quiz_questions'>;
type QuizQuestionOption = Tables<'quiz_question_options'>;

interface QuestionWithOptions extends QuizQuestion {
  quiz_question_options: QuizQuestionOption[];
}

interface QuestionManagementProps {
  quizId: string;
  quizTitle: string;
}

const QuestionManagement = ({ quizId, quizTitle }: QuestionManagementProps) => {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithOptions | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const fetchQuestions = async () => {
    logger.log('QUESTION MANAGEMENT: Fetching questions for quiz:', quizId);
    try {
      setLoading(true);
      
      // First fetch questions without deleted ones
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true });

      if (questionsError) {
        logger.error('QUESTION MANAGEMENT: Error fetching questions:', questionsError);
        throw questionsError;
      }

      logger.log('QUESTION MANAGEMENT: Raw questions fetched:', questionsData?.length || 0);

      if (!questionsData || questionsData.length === 0) {
        logger.log('QUESTION MANAGEMENT: No questions found for quiz');
        setQuestions([]);
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
            logger.warn(`QUESTION MANAGEMENT: Error fetching options for question ${question.id}:`, optionsError);
            return {
              ...question,
              quiz_question_options: []
            };
          }

          logger.log(`QUESTION MANAGEMENT: Found ${optionsData?.length || 0} options for question ${question.id}`);

          return {
            ...question,
            quiz_question_options: optionsData || []
          };
        })
      );

      logger.log('QUESTION MANAGEMENT: Final questions with options:', questionsWithOptions.length);
      setQuestions(questionsWithOptions);
    } catch (error) {
      logger.error('QUESTION MANAGEMENT: Error in fetchQuestions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    logger.log('QUESTION MANAGEMENT: Deleting question:', questionId);
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        throw error;
      }

      setQuestions(questions.filter(q => q.id !== questionId));
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      logger.error('QUESTION MANAGEMENT: Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleEditQuestion = (question: QuestionWithOptions) => {
    console.log('QUESTION MANAGEMENT: Opening edit form for question:', question.id);
    setSelectedQuestion(question);
    setEditFormOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestion(questionId);
    }
  };

  const handleCreateFormOpen = () => {
    console.log('QUESTION MANAGEMENT: Opening create form');
    setCreateFormOpen(true);
  };

  const handleQuestionCreated = () => {
    console.log('QUESTION MANAGEMENT: Question created, refreshing list');
    fetchQuestions();
  };

  const handleQuestionUpdated = () => {
    console.log('QUESTION MANAGEMENT: Question updated, refreshing list');
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questions for "{quizTitle}"</h3>
          <p className="text-sm text-gray-600">{questions.length} questions</p>
        </div>
        <Button onClick={handleCreateFormOpen}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-medium">
                  {index + 1}. {question.question_text}
                </CardTitle>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditQuestion(question)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Points: {question.points}</p>
                <div className="space-y-1">
                  {question.quiz_question_options
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((option) => (
                      <div 
                        key={option.id} 
                        className={`p-2 rounded text-sm ${
                          option.is_correct 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {option.option_text}
                        {option.is_correct && (
                          <span className="ml-2 text-xs font-medium">✓ Correct</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions added yet</p>
          <Button 
            onClick={handleCreateFormOpen}
            className="mt-2"
            variant="outline"
          >
            Add Your First Question
          </Button>
        </div>
      )}

      <CreateQuestionForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        quizId={quizId}
        onQuestionCreated={handleQuestionCreated}
      />

      <EditQuestionForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        question={selectedQuestion}
        onQuestionUpdated={handleQuestionUpdated}
      />
    </div>
  );
};

export default QuestionManagement;
