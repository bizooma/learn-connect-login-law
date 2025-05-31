
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Clock, Target, BookOpen, HelpCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<'quizzes'>;
type Unit = Tables<'units'>;
type Course = Tables<'courses'>;

interface QuizWithDetails extends Quiz {
  unit: Unit & {
    section: {
      course: Course;
    };
  };
}

interface QuizCardProps {
  quiz: QuizWithDetails;
  onDelete: (quizId: string) => void;
  onEdit: (quiz: QuizWithDetails) => void;
  onManageQuestions: (quiz: QuizWithDetails) => void;
}

const QuizCard = ({ quiz, onDelete, onEdit, onManageQuestions }: QuizCardProps) => {
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      onDelete(quiz.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {quiz.title}
          </CardTitle>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageQuestions(quiz)}
              className="h-8 w-8 p-0"
              title="Manage Questions"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(quiz)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={quiz.is_active ? "default" : "secondary"}>
            {quiz.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quiz.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {quiz.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="truncate">
              {quiz.unit.section.course.title} → {quiz.unit.title}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Target className="h-4 w-4 mr-1" />
              <span>Pass: {quiz.passing_score}%</span>
            </div>
            
            {quiz.time_limit_minutes && (
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>{quiz.time_limit_minutes}m</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCard;
