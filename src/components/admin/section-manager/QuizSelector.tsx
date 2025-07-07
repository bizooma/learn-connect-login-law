
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
}

interface QuizSelectorProps {
  quizId: string | undefined;
  onQuizUpdate: (quizId: string | undefined) => void;
}

const QuizSelector = ({ quizId, onQuizUpdate }: QuizSelectorProps) => {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  useEffect(() => {
    if (quizId && availableQuizzes.length > 0) {
      const quiz = availableQuizzes.find(q => q.id === quizId);
      setSelectedQuiz(quiz || null);
    } else {
      setSelectedQuiz(null);
    }
  }, [quizId, availableQuizzes]);

  const fetchAvailableQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, passing_score, time_limit_minutes, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) {
        throw error;
      }

      setAvailableQuizzes(data || []);
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuiz = (selectedQuizId: string) => {
    onQuizUpdate(selectedQuizId);
  };

  const handleRemoveQuiz = () => {
    onQuizUpdate(undefined);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-gray-500">Loading quizzes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quizId || !selectedQuiz) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Add a quiz to this unit</span>
            </div>
            {availableQuizzes.length > 0 ? (
              <div className="flex items-center space-x-2">
                <Select onValueChange={handleAddQuiz}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a quiz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No active quizzes available. Create quizzes in the Quiz Management section first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base">Quiz</CardTitle>
            <Badge variant="default">
              {selectedQuiz.title}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveQuiz}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-medium">{selectedQuiz.title}</p>
        {selectedQuiz.description && (
          <p className="text-sm text-gray-600">{selectedQuiz.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Passing Score: {selectedQuiz.passing_score}%</span>
          {selectedQuiz.time_limit_minutes && (
            <span>Time Limit: {selectedQuiz.time_limit_minutes} min</span>
          )}
          <Badge variant={selectedQuiz.is_active ? "default" : "secondary"}>
            {selectedQuiz.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizSelector;
