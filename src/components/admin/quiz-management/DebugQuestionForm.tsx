
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logger } from "@/utils/logger";

interface DebugQuestionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onQuestionCreated: () => void;
}

const DebugQuestionForm = ({ open, onOpenChange, quizId, onQuestionCreated }: DebugQuestionFormProps) => {
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.log('DEBUG SHEET: Form submit triggered with:', questionText);
    
    if (!questionText.trim()) {
      logger.log('DEBUG SHEET: No question text provided');
      return;
    }
    
    setIsSubmitting(true);
    logger.log('DEBUG SHEET: Starting submission...');
    
    // Simulate a successful submission
    setTimeout(() => {
      logger.log('DEBUG SHEET: Form submission completed successfully');
      setIsSubmitting(false);
      setQuestionText("");
      onQuestionCreated();
      onOpenChange(false);
    }, 1000);
  };

  const handleSheetOpenChange = (newOpen: boolean) => {
    logger.log('DEBUG SHEET: Sheet open change:', newOpen);
    if (!newOpen) {
      logger.log('DEBUG SHEET: Sheet is being closed');
    }
    onOpenChange(newOpen);
  };

  const handleCancel = () => {
    logger.log('DEBUG SHEET: Cancel button clicked');
    onOpenChange(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    logger.log('DEBUG SHEET: Input changed:', e.target.value);
    setQuestionText(e.target.value);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Debug: Create Simple Question (Sheet)</SheetTitle>
          <SheetDescription>
            This is a simplified form using Sheet component to test if the form stays open.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question Text</Label>
              <Input
                id="questionText"
                value={questionText}
                onChange={handleInputChange}
                placeholder="Enter a simple question"
                required
              />
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Question"}
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DebugQuestionForm;
