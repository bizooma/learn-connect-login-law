import { useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShareSubjectDialog from "./ShareSubjectDialog";
import { WikiCategory } from "@/hooks/useWikiCategories";

interface Props {
  category: WikiCategory;
}

const ShareGroupsPicker = ({ category }: Props) => {
  const [open, setOpen] = useState(false);
  const sharedGroups = category.shared_groups || [];

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground min-w-0 max-w-full"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Users className="h-3.5 w-3.5 shrink-0" />
        {sharedGroups.length === 0 ? (
          <span className="text-muted-foreground/70">Share…</span>
        ) : sharedGroups.length <= 2 ? (
          <span className="truncate">{sharedGroups.map((g) => g.name).join(", ")}</span>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {sharedGroups.length} groups
          </Badge>
        )}
      </button>
      {open && (
        <ShareSubjectDialog open={open} onOpenChange={setOpen} category={category} />
      )}
    </>
  );
};

export default ShareGroupsPicker;
