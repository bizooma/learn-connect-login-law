import { WikiCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiCategoryRow from "./WikiCategoryRow";
import { WikiColumnsProvider, useWikiColumns } from "./WikiColumnsContext";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WikiCategoryListProps {
  categories: WikiCategory[];
  onEditCategory: (category: WikiCategory) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePublishCategory: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
  selectedTags?: string[];
}

const COLUMN_LABELS = ["Name", "Items", "Category", "Status", "Shared with", "Owner", ""];

const ListInner = ({
  categories,
  onEditCategory,
  onDeleteCategory,
  onTogglePublishCategory,
  onEditArticle,
  searchQuery,
  selectedTags,
}: WikiCategoryListProps) => {
  const { gridTemplate, onMouseDown, reset } = useWikiColumns();
  const forceExpand = !!(selectedTags && selectedTags.length > 0);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div
        className="grid items-center gap-4 px-4 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {COLUMN_LABELS.map((label, i) => (
          <div key={i} className="relative flex items-center pr-2 min-w-0">
            <span className="truncate">{label}</span>
            {i < COLUMN_LABELS.length - 1 && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={onMouseDown(i)}
                className="absolute -right-2 top-1/2 -translate-y-1/2 h-5 w-1 rounded cursor-col-resize bg-border hover:bg-primary/60 transition-colors"
                title="Drag to resize column"
              />
            )}
          </div>
        ))}
      </div>

      {categories.map((category) => (
        <WikiCategoryRow
          key={category.id}
          category={category}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
          onTogglePublish={onTogglePublishCategory}
          onEditArticle={onEditArticle}
          searchQuery={searchQuery}
          defaultExpanded={!!searchQuery || categories.length === 1 || forceExpand}
          selectedTags={selectedTags}
        />
      ))}

      <div className="flex justify-end px-4 py-2 border-t border-border bg-muted/20">
        <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs gap-1">
          <RotateCcw className="h-3 w-3" /> Reset column widths
        </Button>
      </div>
    </div>
  );
};

const WikiCategoryList = (props: WikiCategoryListProps) => {
  if (props.categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No categories yet</p>
        <p className="text-sm">Create your first category to start building your policies & procedures wiki.</p>
      </div>
    );
  }
  return (
    <WikiColumnsProvider>
      <ListInner {...props} />
    </WikiColumnsProvider>
  );
};

export default WikiCategoryList;

