
import { useToast } from "@/hooks/use-toast";

export interface Option {
  text: string;
  isCorrect: boolean;
}

export const useQuestionFormValidation = () => {
  const { toast } = useToast();

  const validateQuestion = (questionText: string, options: Option[]) => {
    if (!questionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return false;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return false;
    }

    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please mark at least one option as correct",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { validateQuestion };
};
