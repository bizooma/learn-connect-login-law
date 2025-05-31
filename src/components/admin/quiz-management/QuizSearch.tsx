
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface QuizSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const QuizSearch = ({ searchTerm, onSearchChange }: QuizSearchProps) => {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="Search quizzes, units, or courses..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
};

export default QuizSearch;
