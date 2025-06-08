
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

  // Fetch quizzes with simplified query to avoid join issues
  const { data: quizzes, isLoading, refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      console.log('Fetching quizzes with simplified query...');
      
      // First, fetch all non-deleted quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (quizzesError) {
        console.error('Error fetching quizzes:', quizzesError);
        throw quizzesError;
      }

      console.log('Fetched quizzes:', quizzesData?.length || 0);

      // Then, fetch question counts for each quiz separately
      const quizzesWithQuestions = await Promise.all(
        (quizzesData || []).map(async (quiz) => {
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
            quiz_questions: Array(count || 0).fill({ id: 'placeholder' }) // Create array for compatibility
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
      return data;
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

  // Updated to use soft delete instead of hard delete
  const handleQuizDeleted = async (quizId: string, title: string) => {
    try {
      const { error } = await supabase.rpc('soft_delete_quiz', { quiz_id: quizId });

      if (error) throw error;

      refetch();
      toast({
        title: "Quiz Moved to Trash",
        description: `"${title}" has been moved to trash. You can restore it from the Deleted Quizzes tab.`,
      });
    } catch (error) {
      console.error('Error soft deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
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
