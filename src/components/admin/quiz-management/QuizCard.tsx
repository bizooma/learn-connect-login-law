
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Settings, 
  Clock, 
  CheckCircle, 
  Users,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { QuizWithDetails } from "./types";

interface QuizCardProps {
  quiz: QuizWithDetails;
  onEdit: (quiz: QuizWithDetails) => void;
  onDelete: (quizId: string, title: string) => void;
  onManageQuestions: (quiz: QuizWithDetails) => void;
}

const QuizCard = ({ quiz, onEdit, onDelete, onManageQuestions }: QuizCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const questionsCount = quiz.quiz_questions?.length || 0;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(quiz.id, quiz.title);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-4">
              {!quiz.is_active && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {quiz.is_active && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{questionsCount} questions</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Pass: {quiz.passing_score}%</span>
            </div>
            
            {quiz.time_limit_minutes && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>{quiz.time_limit_minutes} min</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Created: {format(new Date(quiz.created_at), 'MMM dd, yyyy')}
            {quiz.updated_at !== quiz.created_at && (
              <span className="ml-2">
                • Updated: {format(new Date(quiz.updated_at), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(quiz)}
              className="flex-1 min-w-0"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Quiz
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageQuestions(quiz)}
              className="flex-1 min-w-0"
            >
              <Settings className="h-4 w-4 mr-1" />
              Questions
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        quizTitle={quiz.title}
        questionsCount={questionsCount}
      />
    </>
  );
};

export default QuizCard;
