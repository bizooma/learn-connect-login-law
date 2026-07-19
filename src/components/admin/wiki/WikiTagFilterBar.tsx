import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag, X } from "lucide-react";

export interface AllArticleTagsRow {
  id: string;
  category_id: string;
  tags: string[] | null;
}

export const useAllArticleTags = () => {
  return useQuery({
    queryKey: ["wiki-article-tags-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_articles")
        .select("id, category_id, tags");
      if (error) throw error;
      return (data || []) as AllArticleTagsRow[];
    },
  });
};

interface WikiTagFilterBarProps {
  articles: AllArticleTagsRow[];
  selected: string[];
  onChange: (tags: string[]) => void;
}

const WikiTagFilterBar = ({ articles, selected, onChange }: WikiTagFilterBarProps) => {
  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => (a.tags || []).forEach((t) => t && set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [articles]);

  if (allTags.length === 0) return null;

  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mr-1">
        <Tag className="h-3 w-3" /> Filter by tag:
      </div>
      {allTags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
              active ? "border-black" : "border-border bg-background hover:bg-muted"
            }`}
            style={active ? { backgroundColor: "#FFDA00", color: "#000" } : undefined}
          >
            {tag}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-1"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
};

export default WikiTagFilterBar;
