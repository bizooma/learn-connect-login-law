
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import QuizCard from "./quiz-management/QuizCard";
import QuizSearch from "./quiz-management/QuizSearch";
import CreateQuizForm from "./quiz-management/CreateQuizForm";
import EditQuizForm from "./quiz-management/EditQuizForm";
import QuestionManagement from "./quiz-management/QuestionManagement";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<'quizzes'>;
type Unit = Tables<'units'>;
type Course = Tables<'courses'>;

interface QuizWithDetails extends Quiz {
  unit: Unit & {
    section: {
      course: Course;
    };
  };
}

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithDetails | null>(null);
  const [managingQuestions, setManagingQuestions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          unit:units!inner(
            *,
            section:sections!inner(
              *,
              course:courses!inner(*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        throw error;
      }

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const handleEditQuiz = (quiz: QuizWithDetails) => {
    setSelectedQuiz(quiz);
    setEditFormOpen(true);
  };

  const handleManageQuestions = (quiz: QuizWithDetails) => {
    setSelectedQuiz(quiz);
    setManagingQuestions(true);
  };

  const handleBackToQuizzes = () => {
    setManagingQuestions(false);
    setSelectedQuiz(null);
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.unit.section.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (managingQuestions && selectedQuiz) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleBackToQuizzes}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quizzes
        </Button>
        
        <QuestionManagement
          quizId={selectedQuiz.id}
          quizTitle={selectedQuiz.title}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex items-center justify-between">
        <QuizSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <Button onClick={() => setCreateFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Quizzes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onDelete={deleteQuiz}
            onEdit={handleEditQuiz}
            onManageQuestions={handleManageQuestions}
          />
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No quizzes found</p>
        </div>
      )}

      {/* Create Quiz Form */}
      <CreateQuizForm
        open={createFormOpen}
        onOpenChange={setCreateFormOpen}
        onQuizCreated={fetchQuizzes}
      />

      {/* Edit Quiz Form */}
      <EditQuizForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        quiz={selectedQuiz}
        onQuizUpdated={fetchQuizzes}
      />
    </div>
  );
};

export default QuizManagement;
