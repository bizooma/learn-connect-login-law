
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Trash2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type QuizQuestion = Tables<'quiz_questions'>;
type QuizQuestionOption = Tables<'quiz_question_options'>;

interface QuestionWithOptions extends QuizQuestion {
  quiz_question_options: QuizQuestionOption[];
}

interface EditQuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuestionWithOptions | null;
  onQuestionUpdated: () => void;
}

interface Option {
  id?: string;
  text: string;
  isCorrect: boolean;
}

const EditQuestionForm = ({ open, onOpenChange, question, onQuestionUpdated }: EditQuestionFormProps) => {
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && question) {
      logger.log('EDIT QUESTION: Loading question data:', question.id);
      setQuestionText(question.question_text);
      setPoints(question.points);
      setOptions(
        question.quiz_question_options
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(opt => ({
            id: opt.id,
            text: opt.option_text,
            isCorrect: opt.is_correct
          }))
      );
    }
  }, [open, question]);

  const addOption = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log('EDIT QUESTION: Adding option');
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log('EDIT QUESTION: Removing option at index:', index);
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    logger.log('EDIT QUESTION: Updating option:', index, field, value);
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log('EDIT QUESTION: Form submit triggered');
    
    if (!question || !questionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please mark at least one option as correct",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    logger.log('EDIT QUESTION: Starting update process');
    
    try {
      // Update the question
      const { error: questionError } = await supabase
        .from('quiz_questions')
        .update({
          question_text: questionText.trim(),
          points: points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', question.id);

      if (questionError) {
        throw questionError;
      }

      // Delete existing options
      const { error: deleteError } = await supabase
        .from('quiz_question_options')
        .delete()
        .eq('question_id', question.id);

      if (deleteError) {
        throw deleteError;
      }

      // Create new options
      const optionsToInsert = validOptions.map((option, index) => ({
        question_id: question.id,
        option_text: option.text.trim(),
        is_correct: option.isCorrect,
        sort_order: index,
      }));

      const { error: optionsError } = await supabase
        .from('quiz_question_options')
        .insert(optionsToInsert);

      if (optionsError) {
        throw optionsError;
      }

      logger.log('EDIT QUESTION: Update completed successfully');
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      
      onQuestionUpdated();
      onOpenChange(false);
    } catch (error) {
      logger.error('EDIT QUESTION: Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log('EDIT QUESTION: Cancel button clicked');
    onOpenChange(false);
  };

  const handleSheetOpenChange = (newOpen: boolean) => {
    logger.log('EDIT QUESTION: Sheet open change:', newOpen);
    if (!newOpen) {
      logger.log('EDIT QUESTION: Sheet is being closed');
    }
    onOpenChange(newOpen);
  };

  if (!question) return null;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Question</SheetTitle>
          <SheetDescription>
            Update the question and its answer options
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question *</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter your question"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => updateOption(index, 'isCorrect', checked as boolean)}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => removeOption(index, e)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-sm text-gray-600">Check the box to mark correct answers</p>
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Question"}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditQuestionForm;
