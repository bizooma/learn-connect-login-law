import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface WikiTagChipInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const WikiTagChipInput = ({ value, onChange, placeholder }: WikiTagChipInputProps) => {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const t = raw.trim().replace(/,+$/, "").trim();
    if (!t) return;
    const exists = value.some((v) => v.toLowerCase() === t.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2 py-2 min-h-10">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: "#FFDA00", color: "#000" }}
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="hover:bg-black/10 rounded-full p-0.5"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && commit(draft)}
        placeholder={value.length === 0 ? placeholder || "Add tags..." : ""}
        className="flex-1 min-w-[120px] border-0 shadow-none focus-visible:ring-0 h-6 px-1 py-0 text-sm"
      />
    </div>
  );
};

export default WikiTagChipInput;
