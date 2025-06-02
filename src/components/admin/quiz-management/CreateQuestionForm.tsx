
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateQuestionForm } from "./useCreateQuestionForm";
import QuestionOptionsManager from "./QuestionOptionsManager";

interface CreateQuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onQuestionCreated: () => void;
}

const CreateQuestionForm = ({ open, onOpenChange, quizId, onQuestionCreated }: CreateQuestionFormProps) => {
  const {
    questionText,
    setQuestionText,
    points,
    setPoints,
    options,
    setOptions,
    loading,
    handleSubmit
  } = useCreateQuestionForm({
    quizId,
    onQuestionCreated,
    onClose: () => onOpenChange(false)
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submit triggered');
    handleSubmit(e);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Cancel button clicked');
    onOpenChange(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    console.log('Dialog open change:', newOpen);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
          <DialogDescription>
            Add a multiple choice question to the quiz. Fill in the question text, set the points value, and create answer options.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
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

          <QuestionOptionsManager
            options={options}
            onOptionsChange={setOptions}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
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
