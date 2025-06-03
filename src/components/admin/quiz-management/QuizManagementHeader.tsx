
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuizManagementHeaderProps {
  onCreateQuiz: () => void;
}

const QuizManagementHeader = ({ onCreateQuiz }: QuizManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Quiz Management</h2>
      <Button onClick={onCreateQuiz}>
        <Plus className="h-4 w-4 mr-2" />
        Create Quiz
      </Button>
    </div>
  );
};

export default QuizManagementHeader;
