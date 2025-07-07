
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Edit, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/utils/logger";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  is_active: boolean;
}

interface EnhancedQuizSelectorProps {
  quizId?: string;
  onQuizUpdate: (quizId: string | undefined) => void;
  unitTitle?: string;
  unitId?: string;
}

const EnhancedQuizSelector = ({ quizId, onQuizUpdate, unitTitle, unitId }: EnhancedQuizSelectorProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, passing_score, time_limit_minutes, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setQuizzes(data || []);

      // Find the selected quiz
      if (quizId && data) {
        const quiz = data.find(q => q.id === quizId);
        setSelectedQuiz(quiz || null);
      }
    } catch (error) {
      logger.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleQuizChange = (value: string) => {
    if (value === 'none') {
      onQuizUpdate(undefined);
      setSelectedQuiz(null);
    } else {
      onQuizUpdate(value);
      const quiz = quizzes.find(q => q.id === value);
      setSelectedQuiz(quiz || null);
    }
  };

  const handleRemoveQuiz = () => {
    onQuizUpdate(undefined);
    setSelectedQuiz(null);
  };

  const handleCreateNewQuiz = () => {
    // Open quiz management in a new tab with context
    const url = `/admin?tab=quizzes&createNew=true&unitTitle=${encodeURIComponent(unitTitle || '')}`;
    window.open(url, '_blank');
  };

  const handleEditQuiz = () => {
    if (selectedQuiz) {
      const url = `/admin?tab=quizzes&edit=${selectedQuiz.id}`;
      window.open(url, '_blank');
    }
  };

  if (selectedQuiz) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-base text-blue-900">Quiz Assigned</CardTitle>
              <Badge variant="default" className="bg-blue-600">
                {selectedQuiz.title}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditQuiz}
                className="text-blue-600 hover:text-blue-700"
                title="Edit quiz"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveQuiz}
                className="text-red-600 hover:text-red-700"
                title="Remove quiz"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-blue-900">{selectedQuiz.title}</h4>
            {selectedQuiz.description && (
              <p className="text-sm text-blue-700 mt-1">{selectedQuiz.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-blue-600">
            <span>Passing Score: {selectedQuiz.passing_score}%</span>
            {selectedQuiz.time_limit_minutes && (
              <span>Time Limit: {selectedQuiz.time_limit_minutes} min</span>
            )}
            <Badge variant={selectedQuiz.is_active ? "default" : "secondary"} className="text-xs">
              {selectedQuiz.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              Students will access this quiz after completing the unit content.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-700">Quiz Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Assign an existing quiz</Label>
          <Select value={quizId || 'none'} onValueChange={handleQuizChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading quizzes..." : "Select a quiz"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Quiz</SelectItem>
              {quizzes.map((quiz) => (
                <SelectItem key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNewQuiz}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Quiz</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/admin?tab=quizzes', '_blank')}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Manage All Quizzes</span>
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Tip:</strong> Create quizzes with questions that test understanding of this unit's content. Students must pass the quiz to complete the unit.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedQuizSelector;
