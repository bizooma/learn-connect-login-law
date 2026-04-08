import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface WikiSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const WikiSearchBar = ({ value, onChange }: WikiSearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search or ask a question"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-background border-border"
      />
    </div>
  );
};

export default WikiSearchBar;
