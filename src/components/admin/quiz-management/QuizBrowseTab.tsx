
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, AlertCircle } from "lucide-react";
import QuizCard from "./QuizCard";
import { QuizWithDetails } from "./types";

interface QuizBrowseTabProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredQuizzes: QuizWithDetails[];
  totalQuizzes: number;
  isLoading: boolean;
  onEdit: (quiz: QuizWithDetails) => void;
  onDelete: (quizId: string, title: string) => void;
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
  onSwitchToImport,
}: QuizBrowseTabProps) => {
  // Separate quizzes into assigned and unassigned
  const assignedQuizzes = filteredQuizzes.filter(quiz => quiz.unit_id);
  const unassignedQuizzes = filteredQuizzes.filter(quiz => !quiz.unit_id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateQuiz} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
          <Button variant="outline" onClick={onSwitchToImport}>
            <FileText className="h-4 w-4 mr-2" />
            Import from PowerPoint
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned to Units</p>
                <p className="text-2xl font-bold">{assignedQuizzes.length}</p>
              </div>
              <Badge variant="default" className="h-8 w-8 rounded-full flex items-center justify-center text-xs">
                ✓
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold">{unassignedQuizzes.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Quizzes Section */}
      {unassignedQuizzes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Unassigned Quizzes</h3>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {unassignedQuizzes.length}
            </Badge>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">These quizzes are not assigned to any units yet.</p>
                <p className="text-sm text-orange-700">Assign them to units through the course editing interface to make them available to students.</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {unassignedQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={onEdit}
                onDelete={onDelete}
                onManageQuestions={onManageQuestions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Assigned Quizzes Section */}
      {assignedQuizzes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Assigned Quizzes</h3>
            <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
              {assignedQuizzes.length}
            </Badge>
          </div>
          <div className="grid gap-4">
            {assignedQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onEdit={onEdit}
                onDelete={onDelete}
                onManageQuestions={onManageQuestions}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredQuizzes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "No quizzes found" : "No quizzes yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first quiz to get started with assessments"}
            </p>
            {!searchTerm && (
              <div className="flex justify-center gap-3">
                <Button onClick={onCreateQuiz}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
                <Button variant="outline" onClick={onSwitchToImport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Import from PowerPoint
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizBrowseTab;
