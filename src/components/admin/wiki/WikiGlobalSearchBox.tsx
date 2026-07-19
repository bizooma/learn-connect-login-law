import { useEffect, useRef, useState } from "react";
import { Search, Loader2, FileText, GitBranch, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  useWikiGlobalSearch,
  highlightSnippet,
  type WikiSearchResult,
} from "@/hooks/useWikiGlobalSearch";

interface WikiGlobalSearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const KindIcon = ({ r }: { r: WikiSearchResult }) => {
  if (r.kind === "subject") return <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (r.kind === "article" && r.contentType === "flowchart")
    return <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
};

const WikiGlobalSearchBox = ({ value, onChange, placeholder }: WikiGlobalSearchBoxProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: results = [], isFetching } = useWikiGlobalSearch(value);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (r: WikiSearchResult) => {
    setOpen(false);
    if (r.kind === "page") {
      navigate(`/admin/wiki/pages/${r.id}`);
    } else if (r.kind === "article") {
      if (r.contentType === "flowchart") navigate(`/admin/wiki/flowchart/${r.id}`);
      else navigate(`/admin/wiki/content?article=${r.id}`);
    } else {
      navigate("/admin/wiki/content", { state: { activeCategoryId: r.id } });
    }
  };

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder || "Search all subjects, documents, and pages…"}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="pl-10 bg-background border-border"
      />
      {isFetching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full max-h-[420px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
          {results.length === 0 && !isFetching && (
            <div className="px-3 py-4 text-sm text-muted-foreground">No matches</div>
          )}
          {results.map((r) => {
            const breadcrumb =
              r.kind === "page"
                ? `${r.subjectTitle} › ${r.articleTitle} › Page`
                : r.kind === "article"
                ? `${r.subjectTitle} › Document`
                : "Subject";
            return (
              <button
                key={`${r.kind}-${r.id}`}
                type="button"
                onClick={() => go(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/60 border-b border-border last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <KindIcon r={r} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground truncate">
                      <span className="truncate">{breadcrumb}</span>
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    </div>
                    <div className="text-sm font-medium text-foreground truncate">
                      {r.title || "Untitled"}
                    </div>
                    {r.snippet && (
                      <div
                        className="text-xs text-muted-foreground line-clamp-2 mt-0.5"
                        dangerouslySetInnerHTML={{ __html: highlightSnippet(r.snippet, value) }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WikiGlobalSearchBox;
