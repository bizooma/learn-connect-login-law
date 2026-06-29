import { WikiCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiCategoryRow from "./WikiCategoryRow";

interface WikiCategoryListProps {
  categories: WikiCategory[];
  onEditCategory: (category: WikiCategory) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePublishCategory: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
}

const WikiCategoryList = ({
  categories,
  onEditCategory,
  onDeleteCategory,
  onTogglePublishCategory,
  onEditArticle,
  searchQuery,
}: WikiCategoryListProps) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No categories yet</p>
        <p className="text-sm">Create your first category to start building your policies & procedures wiki.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="grid grid-cols-[1fr_90px_120px_90px_140px_80px_60px] items-center gap-4 px-4 py-2 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Name</span>
        <span>Items</span>
        <span>Category</span>
        <span>Status</span>
        <span>Shared with</span>
        <span>Owner</span>
        <span></span>
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
          defaultExpanded={!!searchQuery}
        />
      ))}

    </div>
  );
};

export default WikiCategoryList;
