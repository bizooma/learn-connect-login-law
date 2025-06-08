
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  quizTitle: string;
  questionsCount: number;
}

const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  quizTitle,
  questionsCount
}: DeleteConfirmationDialogProps) => {
  const [confirmationText, setConfirmationText] = useState("");
  const expectedText = "DELETE";

  const handleConfirm = () => {
    if (confirmationText === expectedText) {
      onConfirm();
      setConfirmationText("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle className="text-red-900">
              Delete Quiz Permanently
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p className="font-semibold">You are about to delete:</p>
            <p className="bg-gray-50 p-2 rounded border">"{quizTitle}"</p>
            <p className="text-sm text-red-600">
              This quiz contains {questionsCount} question{questionsCount !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="mt-4">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Type "DELETE" to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type DELETE here"
                className="mt-1"
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmationText !== expectedText}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Quiz
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
