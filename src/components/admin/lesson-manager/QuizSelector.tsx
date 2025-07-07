
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface Quiz {
  id: string;
  title: string;
}

interface QuizSelectorProps {
  quizId?: string;
  onQuizUpdate: (quizId: string | undefined) => void;
}

const QuizSelector = ({ quizId, onQuizUpdate }: QuizSelectorProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('is_active', true)
        .eq('is_deleted', false) // Only fetch non-deleted quizzes
        .order('title');

      if (error) throw error;
      setQuizzes(data || []);
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
    } else {
      onQuizUpdate(value);
    }
  };

  const handleRemoveQuiz = () => {
    onQuizUpdate(undefined);
  };

  return (
    <div className="space-y-2">
      <Label>Quiz (Optional)</Label>
      <div className="flex items-center space-x-2">
        <Select value={quizId || 'none'} onValueChange={handleQuizChange} disabled={loading}>
          <SelectTrigger className="flex-1">
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
        
        {quizId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveQuiz}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/admin?tab=quizzes', '_blank')}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Quiz
        </Button>
      </div>
      
      {quizId && (
        <p className="text-sm text-gray-600">
          Selected quiz will be available to students after completing this unit.
        </p>
      )}
    </div>
  );
};

export default QuizSelector;
