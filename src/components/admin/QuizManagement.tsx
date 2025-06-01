
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QuizCard from "./quiz-management/QuizCard";
import CreateQuizForm from "./quiz-management/CreateQuizForm";
import EditQuizForm from "./quiz-management/EditQuizForm";
import QuizSearch from "./quiz-management/QuizSearch";
import { QuizWithDetails } from "./quiz-management/types";

const QuizManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizWithDetails | null>(null);

  const { data: quizzes, isLoading, error, refetch } = useQuery({
    queryKey: ['quizzes-with-details'],
    queryFn: async () => {
      console.log('Fetching quizzes with details...');
      
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          unit:units (
            *,
            lesson:lessons (
              *,
              course:courses (*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
      }

      console.log('Quizzes fetched:', data);
      return data as QuizWithDetails[];
    }
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load quizzes",
      variant: "destructive",
    });
  }

  const filteredQuizzes = quizzes?.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.unit?.lesson?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleQuizCreated = () => {
    setShowCreateForm(false);
    refetch();
    toast({
      title: "Success",
      description: "Quiz created successfully",
    });
  };

  const handleQuizUpdated = () => {
    setEditingQuiz(null);
    refetch();
    toast({
      title: "Success",
      description: "Quiz updated successfully",
    });
  };

  const handleQuizDeleted = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      refetch();
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quiz Management</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalQuizzes={quizzes?.length || 0}
      />

      <div className="grid gap-4">
        {filteredQuizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onEdit={() => setEditingQuiz(quiz)}
            onDelete={() => handleQuizDeleted(quiz.id)}
          />
        ))}
      </div>

      {filteredQuizzes.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No quizzes found</p>
        </div>
      )}

      <CreateQuizForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onQuizCreated={handleQuizCreated}
      />

      {editingQuiz && (
        <EditQuizForm
          open={!!editingQuiz}
          onOpenChange={() => setEditingQuiz(null)}
          quiz={editingQuiz}
          onQuizUpdated={handleQuizUpdated}
        />
      )}
    </div>
  );
};

export default QuizManagement;
