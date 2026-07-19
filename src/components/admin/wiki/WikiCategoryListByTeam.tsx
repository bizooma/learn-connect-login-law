import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { WikiCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiCategoryList from "./WikiCategoryList";

interface WikiCategoryListByTeamProps {
  categories: WikiCategory[];
  onEditCategory: (category: WikiCategory) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePublishCategory: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
}

interface Bucket {
  key: string;
  name: string;
  subjects: WikiCategory[];
}

const UNASSIGNED_KEY = "__unassigned__";

const WikiCategoryListByTeam = (props: WikiCategoryListByTeamProps) => {
  const { categories } = props;

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    const unassigned: WikiCategory[] = [];

    categories.forEach((cat) => {
      const groups = cat.shared_groups || [];
      if (groups.length === 0) {
        unassigned.push(cat);
      } else {
        groups.forEach((g) => {
          if (!map.has(g.id)) map.set(g.id, { key: g.id, name: g.name, subjects: [] });
          map.get(g.id)!.subjects.push(cat);
        });
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (unassigned.length > 0) {
      sorted.push({ key: UNASSIGNED_KEY, name: "Unassigned", subjects: unassigned });
    }
    return sorted;
  }, [categories]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(buckets.map((b) => [b.key, true])),
  );

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (buckets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No subjects to group</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => {
        const isOpen = expanded[bucket.key] !== false;
        return (
          <div key={bucket.key} className="rounded-lg border border-border overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => toggle(bucket.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors border-b border-border"
              style={isOpen ? { borderLeft: "4px solid #FFDA00" } : undefined}
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{bucket.name}</span>
                <span className="text-xs text-muted-foreground">
                  · {bucket.subjects.length} {bucket.subjects.length === 1 ? "subject" : "subjects"}
                </span>
              </div>
            </button>
            {isOpen && (
              <div className="p-2">
                <WikiCategoryList
                  categories={bucket.subjects}
                  onEditCategory={props.onEditCategory}
                  onDeleteCategory={props.onDeleteCategory}
                  onTogglePublishCategory={props.onTogglePublishCategory}
                  onEditArticle={props.onEditArticle}
                  searchQuery={props.searchQuery}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WikiCategoryListByTeam;
