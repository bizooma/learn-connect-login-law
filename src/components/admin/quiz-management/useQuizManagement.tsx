
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QuizWithDetails } from "./types";

interface Unit {
  id: string;
  title: string;
  section: {
    title: string;
    module: {
      title: string;
      course: {
        title: string;
      };
    };
  };
}

export const useQuizManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizWithDetails | null>(null);
  const [importedQuizData, setImportedQuizData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch quizzes with proper filtering for soft-deleted items
  const { data: quizzes, isLoading, refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      console.log('Fetching active quizzes...');
      
      // Fetch only non-deleted quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_deleted', false)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (quizzesError) {
        console.error('Error fetching quizzes:', quizzesError);
        throw quizzesError;
      }

      console.log('Fetched active quizzes:', quizzesData?.length || 0);

      // Remove duplicates by id and fetch question counts
      const uniqueQuizzes = quizzesData ? quizzesData.filter((quiz, index, self) => 
        index === self.findIndex(q => q.id === quiz.id)
      ) : [];

      const quizzesWithQuestions = await Promise.all(
        uniqueQuizzes.map(async (quiz) => {
          const { count, error: countError } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id)
            .eq('is_deleted', false);

          if (countError) {
            console.warn(`Error counting questions for quiz ${quiz.id}:`, countError);
          }

          return {
            ...quiz,
            quiz_questions: Array(count || 0).fill({ id: 'placeholder' })
          };
        })
      );

      console.log('Quizzes with question counts:', quizzesWithQuestions.length);
      return quizzesWithQuestions as QuizWithDetails[];
    }
  });

  // Fetch units
  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select(`
          id,
          title,
          section:lessons!inner (
            title,
            module:modules!inner (
              title,
              course:courses!inner (
                title
              )
            )
          )
        `);

      if (error) throw error;
      
      // Remove any duplicates by id
      const uniqueUnits = data ? data.filter((unit, index, self) => 
        index === self.findIndex(u => u.id === unit.id)
      ) : [];
      
      return uniqueUnits;
    }
  });

  const filteredQuizzes = quizzes?.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleQuizDeleted = async (quizId: string, title: string) => {
    try {
      console.log('Attempting to delete quiz:', quizId, title);
      
      const { data, error } = await supabase.rpc('soft_delete_quiz', { 
        quiz_id: quizId 
      });

      console.log('Soft delete response:', { data, error });

      if (error) {
        console.error('Error from soft_delete_quiz function:', error);
        throw error;
      }

      if (data === false) {
        throw new Error('Quiz not found or could not be deleted');
      }

      console.log('Quiz successfully soft deleted');
      refetch();
      toast({
        title: "Quiz Moved to Trash",
        description: `"${title}" has been moved to trash. You can restore it from the Deleted Quizzes tab.`,
      });
    } catch (error: any) {
      console.error('Error soft deleting quiz:', error);
      
      let errorMessage = "Failed to delete quiz";
      if (error.message) {
        if (error.message.includes('Only admins can delete quizzes')) {
          errorMessage = "You don't have permission to delete quizzes";
        } else if (error.message.includes('Quiz not found')) {
          errorMessage = "Quiz not found or already deleted";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleManageQuestions = (quiz: QuizWithDetails) => {
    navigate(`/admin?tab=quiz-questions&quizId=${quiz.id}`);
  };

  return {
    searchTerm,
    setSearchTerm,
    showCreateForm,
    setShowCreateForm,
    editingQuiz,
    setEditingQuiz,
    importedQuizData,
    setImportedQuizData,
    activeTab,
    setActiveTab,
    quizzes,
    units,
    isLoading,
    filteredQuizzes,
    handleQuizCreated,
    handleQuizUpdated,
    handleQuizDeleted,
    handleManageQuestions,
    refetch
  };
};
