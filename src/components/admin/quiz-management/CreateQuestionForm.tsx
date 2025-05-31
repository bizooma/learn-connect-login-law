
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface CreateQuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onQuestionCreated: () => void;
}

interface Option {
  text: string;
  isCorrect: boolean;
}

const CreateQuestionForm = ({ open, onOpenChange, quizId, onQuestionCreated }: CreateQuestionFormProps) => {
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<Option[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText.trim()) {
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
    
    try {
      // Get the next sort order
      const { data: existingQuestions } = await supabase
        .from('quiz_questions')
        .select('sort_order')
        .eq('quiz_id', quizId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existingQuestions?.[0]?.sort_order ? existingQuestions[0].sort_order + 1 : 0;

      // Create the question
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question_text: questionText.trim(),
          points: points,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (questionError) {
        throw questionError;
      }

      // Create the options
      const optionsToInsert = validOptions.map((option, index) => ({
        question_id: questionData.id,
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

      toast({
        title: "Success",
        description: "Question created successfully",
      });
      
      resetForm();
      onQuestionCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionText("");
    setPoints(1);
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Add a multiple choice question to the quiz
          </DialogDescription>
        </DialogHeader>
        
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
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-sm text-gray-600">Check the box to mark correct answers</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestionForm;
