import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuizCard from "./quiz-management/QuizCard";
import CreateQuizForm from "./quiz-management/CreateQuizForm";
import EditQuizForm from "./quiz-management/EditQuizForm";
import QuizSearch from "./quiz-management/QuizSearch";
import PowerPointImport from "./quiz-management/PowerPointImport";
import ImportedQuizPreview from "./quiz-management/ImportedQuizPreview";
import { QuizWithDetails } from "./quiz-management/types";

const QuizManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizWithDetails | null>(null);
  const [importedQuizData, setImportedQuizData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("browse");

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

  // Fetch units for the import preview
  const { data: units } = useQuery({
    queryKey: ['units-for-quiz-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select(`
          id,
          title,
          lesson:lessons (
            title,
            course:courses (
              title
            )
          )
        `)
        .order('title');

      if (error) throw error;
      return data;
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

  const handleManageQuestions = (quiz: QuizWithDetails) => {
    setEditingQuiz(quiz);
  };

  const handleImportComplete = (importData: any) => {
    setImportedQuizData(importData);
    setActiveTab("review");
  };

  const handleConfirmImport = async (finalData: any) => {
    try {
      // Create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: finalData.title,
          description: finalData.description,
          unit_id: finalData.unit_id,
          passing_score: finalData.passing_score,
          time_limit_minutes: finalData.time_limit_minutes,
          source_type: 'powerpoint',
          is_active: true
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and options
      for (let i = 0; i < finalData.questions.length; i++) {
        const question = finalData.questions[i];
        
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: question.question_text,
            question_type: 'multiple_choice',
            points: 1,
            sort_order: i,
            source_slide_number: question.slide_number
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create options
        const optionsToInsert = question.options.map((option: any, optionIndex: number) => ({
          question_id: questionData.id,
          option_text: option.text,
          is_correct: option.is_correct,
          sort_order: optionIndex
        }));

        const { error: optionsError } = await supabase
          .from('quiz_question_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      setImportedQuizData(null);
      setActiveTab("browse");
      refetch();
      
      toast({
        title: "Success",
        description: `Quiz "${finalData.title}" created with ${finalData.questions.length} questions`,
      });

    } catch (error) {
      console.error('Error creating imported quiz:', error);
      toast({
        title: "Error",
        description: "Failed to create quiz from import",
        variant: "destructive",
      });
    }
  };

  const handleCancelImport = () => {
    setImportedQuizData(null);
    setActiveTab("browse");
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quiz Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Quizzes</TabsTrigger>
          <TabsTrigger value="import">Import from PowerPoint</TabsTrigger>
          {importedQuizData && (
            <TabsTrigger value="review">Review Import</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
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
                onManageQuestions={() => handleManageQuestions(quiz)}
              />
            ))}
          </div>

          {filteredQuizzes.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No quizzes found</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={() => setShowCreateForm(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Quiz
                </Button>
                <Button onClick={() => setActiveTab("import")} variant="outline">
                  Import from PowerPoint
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import">
          <PowerPointImport onImportComplete={handleImportComplete} />
        </TabsContent>

        {importedQuizData && (
          <TabsContent value="review">
            <ImportedQuizPreview
              importData={importedQuizData}
              onConfirmImport={handleConfirmImport}
              onCancel={handleCancelImport}
              units={units || []}
            />
          </TabsContent>
        )}
      </Tabs>

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
