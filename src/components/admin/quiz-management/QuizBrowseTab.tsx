
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import QuizCard from "./QuizCard";
import QuizSearch from "./QuizSearch";
import { QuizWithDetails } from "./types";

interface QuizBrowseTabProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredQuizzes: QuizWithDetails[];
  totalQuizzes: number;
  isLoading: boolean;
  onEdit: (quiz: QuizWithDetails) => void;
  onDelete: (quizId: string) => void;
  onManageQuestions: (quiz: QuizWithDetails) => void;
  onCreateQuiz: () => void;
  onSwitchToImport: () => void;
}

const QuizBrowseTab = ({
  searchTerm,
  onSearchChange,
  filteredQuizzes,
  totalQuizzes,
  isLoading,
  onEdit,
  onDelete,
  onManageQuestions,
  onCreateQuiz,
  onSwitchToImport
}: QuizBrowseTabProps) => {
  return (
    <div className="space-y-4">
      <QuizSearch
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        totalQuizzes={totalQuizzes}
      />

      <div className="grid gap-4">
        {filteredQuizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onEdit={() => onEdit(quiz)}
            onDelete={() => onDelete(quiz.id)}
            onManageQuestions={() => onManageQuestions(quiz)}
          />
        ))}
      </div>

      {filteredQuizzes.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No quizzes found</p>
          <div className="flex justify-center space-x-2">
            <Button onClick={onCreateQuiz} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </Button>
            <Button onClick={onSwitchToImport} variant="outline">
              Import from PowerPoint
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizBrowseTab;
