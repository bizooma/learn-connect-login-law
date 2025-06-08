
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  unit_id?: string;
  quiz_questions?: Array<{ id: string }>;
}

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
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [importedQuizData, setImportedQuizData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch quizzes with proper filtering for non-deleted items
  const { data: quizzes, isLoading, refetch } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (id)
        `)
        .eq('is_deleted', false) // Only fetch non-deleted quizzes
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
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

  const handleManageQuestions = (quizId: string) => {
    navigate(`/admin?tab=quiz-questions&quizId=${quizId}`);
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
