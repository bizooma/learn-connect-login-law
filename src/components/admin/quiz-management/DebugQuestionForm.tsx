
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    console.log('Debug form submit triggered with:', questionText);
    
    if (!questionText.trim()) {
      console.log('No question text provided');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate a successful submission
    setTimeout(() => {
      console.log('Debug form submission completed');
      setIsSubmitting(false);
      setQuestionText("");
      onQuestionCreated();
      onOpenChange(false);
    }, 1000);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    console.log('Debug dialog open change:', newOpen);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Debug: Create Simple Question</DialogTitle>
          <DialogDescription>
            This is a simplified form to test if the dialog stays open.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="questionText">Question Text</Label>
            <Input
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter a simple question"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DebugQuestionForm;
