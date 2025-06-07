
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Settings, AlertCircle } from "lucide-react";
import { QuizWithDetails } from "./types";

interface QuizCardProps {
  quiz: QuizWithDetails;
  onEdit: (quiz: QuizWithDetails) => void;
  onDelete: (quizId: string) => void;
  onManageQuestions: (quiz: QuizWithDetails) => void;
}

const QuizCard = ({ quiz, onEdit, onDelete, onManageQuestions }: QuizCardProps) => {
  return (
    <Card className={quiz.unit_id ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-sm text-gray-600">{quiz.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageQuestions(quiz)}
              title="Manage questions"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(quiz)}
              title="Edit quiz"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(quiz.id)}
              className="text-red-600 hover:text-red-700"
              title="Delete quiz"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Passing Score: <strong>{quiz.passing_score}%</strong></span>
          {quiz.time_limit_minutes && (
            <span>Time Limit: <strong>{quiz.time_limit_minutes} min</strong></span>
          )}
          <Badge variant={quiz.is_active ? "default" : "secondary"}>
            {quiz.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {quiz.unit_id && quiz.unit ? (
          <div className="flex items-center gap-2 p-2 bg-green-100 rounded-md">
            <Badge variant="default" className="bg-green-600">
              Assigned
            </Badge>
            <span className="text-sm text-green-800">
              {quiz.unit.title}
              {quiz.unit.lesson?.course && (
                <span className="text-green-600"> • {quiz.unit.lesson.course.title}</span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-orange-100 rounded-md">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Not assigned to any unit yet
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizCard;
