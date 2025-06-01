
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface QuizSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalQuizzes: number;
}

const QuizSearch = ({ searchTerm, onSearchChange, totalQuizzes }: QuizSearchProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search quizzes, units, or courses..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="text-sm text-gray-600">
        {totalQuizzes} quiz{totalQuizzes !== 1 ? 'es' : ''} total
      </div>
    </div>
  );
};

export default QuizSearch;
