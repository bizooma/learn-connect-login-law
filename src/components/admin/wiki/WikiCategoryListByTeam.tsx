import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { WikiCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiCategoryList from "./WikiCategoryList";
import {
  DEPARTMENTS,
  Department,
  GROUP_TO_DEPARTMENT,
} from "@/components/hub/departmentMap";

interface WikiCategoryListByTeamProps {
  categories: WikiCategory[];
  onEditCategory: (category: WikiCategory) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePublishCategory: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
}

const UNASSIGNED_KEY = "Unassigned";

interface Bucket {
  key: string;
  name: string;
  subjects: WikiCategory[];
}

const WikiCategoryListByTeam = (props: WikiCategoryListByTeamProps) => {
  const { categories } = props;

  const buckets = useMemo<Bucket[]>(() => {
    const deptSubjects: Record<Department, Map<string, WikiCategory>> = {
      Legal: new Map(),
      Sales: new Map(),
      Marketing: new Map(),
      "People & Culture": new Map(),
      Finance: new Map(),
      Operations: new Map(),
    };
    const unassigned = new Map<string, WikiCategory>();

    categories.forEach((cat) => {
      const groups = cat.shared_groups || [];
      const depts = new Set<Department>();
      groups.forEach((g) => {
        GROUP_TO_DEPARTMENT(g.name).forEach((d) => depts.add(d));
      });
      if (depts.size === 0) {
        unassigned.set(cat.id, cat);
      } else {
        depts.forEach((d) => deptSubjects[d].set(cat.id, cat));
      }
    });

    const ordered: Bucket[] = DEPARTMENTS.map((d) => ({
      key: d,
      name: d,
      subjects: Array.from(deptSubjects[d].values()),
    }));
    ordered.push({
      key: UNASSIGNED_KEY,
      name: "Unassigned",
      subjects: Array.from(unassigned.values()),
    });
    return ordered;
  }, [categories]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => {
        const isOpen = expanded[bucket.key] !== false;
        const isEmpty = bucket.subjects.length === 0;
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
                {isEmpty ? (
                  <div className="text-sm text-muted-foreground italic px-3 py-6 text-center">
                    No SOPs assigned yet
                  </div>
                ) : (
                  <WikiCategoryList
                    categories={bucket.subjects}
                    onEditCategory={props.onEditCategory}
                    onDeleteCategory={props.onDeleteCategory}
                    onTogglePublishCategory={props.onTogglePublishCategory}
                    onEditArticle={props.onEditArticle}
                    searchQuery={props.searchQuery}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WikiCategoryListByTeam;
