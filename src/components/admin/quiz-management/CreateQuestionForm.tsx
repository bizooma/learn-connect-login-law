
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCreateQuestionForm } from "./useCreateQuestionForm";
import QuestionOptionsManager from "./QuestionOptionsManager";
import { logger } from "@/utils/logger";

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
    logger.log('CREATE QUESTION: Form submit triggered');
    handleSubmit(e);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log('CREATE QUESTION: Cancel button clicked');
    onOpenChange(false);
  };

  const handleSheetOpenChange = (newOpen: boolean) => {
    logger.log('CREATE QUESTION: Sheet open change:', newOpen);
    if (!newOpen) {
      logger.log('CREATE QUESTION: Sheet is being closed');
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Question</SheetTitle>
          <SheetDescription>
            Add a multiple choice question to the quiz. Fill in the question text, set the points value, and create answer options.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
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

            <SheetFooter className="pt-4">
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
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateQuestionForm;
