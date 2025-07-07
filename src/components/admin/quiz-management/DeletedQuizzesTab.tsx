
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { logger } from "@/utils/logger";

interface DeletedQuiz {
  id: string;
  title: string;
  description?: string;
  deleted_at: string;
  questions_count: number;
}

interface DeletedQuizzesTabProps {
  onQuizRestored: () => void;
}

const DeletedQuizzesTab = ({ onQuizRestored }: DeletedQuizzesTabProps) => {
  const [deletedQuizzes, setDeletedQuizzes] = useState<DeletedQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDeletedQuizzes = async () => {
    setLoading(true);
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          deleted_at,
          quiz_questions!inner(id)
        `)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      const formattedQuizzes: DeletedQuiz[] = quizzes?.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        deleted_at: quiz.deleted_at!,
        questions_count: quiz.quiz_questions?.length || 0
      })) || [];

      setDeletedQuizzes(formattedQuizzes);
    } catch (error) {
      logger.error('Error fetching deleted quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load deleted quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedQuizzes();
  }, []);

  const handleRestore = async (quizId: string, title: string) => {
    try {
      const { error } = await supabase.rpc('restore_quiz', { quiz_id: quizId });

      if (error) throw error;

      toast({
        title: "Quiz Restored",
        description: `"${title}" has been restored successfully.`,
      });

      fetchDeletedQuizzes();
      onQuizRestored();
    } catch (error) {
      logger.error('Error restoring quiz:', error);
      toast({
        title: "Error",
        description: "Failed to restore quiz",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (quizId: string, title: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // First delete related data
      await supabase
        .from('quiz_question_options')
        .delete()
        .in('question_id', 
          (await supabase
            .from('quiz_questions')
            .select('id')
            .eq('quiz_id', quizId)
          ).data?.map(q => q.id) || []
        );

      await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      toast({
        title: "Quiz Permanently Deleted",
        description: `"${title}" has been permanently removed.`,
      });

      fetchDeletedQuizzes();
    } catch (error) {
      logger.error('Error permanently deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete quiz",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading deleted quizzes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5" />
          <span>Deleted Quizzes ({deletedQuizzes.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deletedQuizzes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No deleted quizzes found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Title</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Deleted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{quiz.title}</div>
                      {quiz.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {quiz.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {quiz.questions_count} questions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(quiz.deleted_at), 'MMM dd, yyyy')}
                      <div className="text-xs text-gray-500">
                        {format(new Date(quiz.deleted_at), 'HH:mm')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(quiz.id, quiz.title)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermanentDelete(quiz.id, quiz.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Forever
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DeletedQuizzesTab;
