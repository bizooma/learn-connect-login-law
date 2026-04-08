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
