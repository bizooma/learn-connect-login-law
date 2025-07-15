
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateQuizForm from "./quiz-management/CreateQuizForm";
import EditQuizForm from "./quiz-management/EditQuizForm";
import PowerPointImport from "./quiz-management/PowerPointImport";
import ImportedQuizPreview from "./quiz-management/ImportedQuizPreview";
import QuizManagementHeader from "./quiz-management/QuizManagementHeader";
import QuizBrowseTab from "./quiz-management/QuizBrowseTab";
import QuizManagementLoading from "./quiz-management/QuizManagementLoading";
import DeletedQuizzesTab from "./quiz-management/DeletedQuizzesTab";
import QuestionManagement from "./quiz-management/QuestionManagement";
import { useQuizManagement } from "./quiz-management/useQuizManagement";
import { useQuizImportManager } from "./quiz-management/QuizImportManager";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface QuizManagementProps {
  quizId?: string | null;
}

const QuizManagement = ({ quizId }: QuizManagementProps) => {
  const navigate = useNavigate();
  const {
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
  } = useQuizManagement();

  const {
    handleImportComplete,
    handleConfirmImport,
    handleCancelImport
  } = useQuizImportManager({
    refetch,
    setImportedQuizData,
    setActiveTab
  });

  // If quizId is provided, show the question management component
  if (quizId && quizzes) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) {
      return <QuestionManagement quizId={quizId} quizTitle={quiz.title} />;
    }
  }

  if (isLoading) {
    return <QuizManagementLoading />;
  }

  return (
    <div className="space-y-6">
      <QuizManagementHeader onCreateQuiz={() => setShowCreateForm(true)} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Quizzes</TabsTrigger>
          <TabsTrigger value="import">Import from PowerPoint</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Quizzes</TabsTrigger>
          {importedQuizData && (
            <TabsTrigger value="review">Review Import</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <QuizBrowseTab
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filteredQuizzes={filteredQuizzes}
            totalQuizzes={quizzes?.length || 0}
            isLoading={isLoading}
            onEdit={setEditingQuiz}
            onDelete={handleQuizDeleted}
            onManageQuestions={handleManageQuestions}
            onCreateQuiz={() => setShowCreateForm(true)}
            onSwitchToImport={() => setActiveTab("import")}
          />
        </TabsContent>

        <TabsContent value="import">
          <PowerPointImport onImportComplete={handleImportComplete} />
        </TabsContent>

        <TabsContent value="deleted">
          <DeletedQuizzesTab onQuizRestored={refetch} />
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
