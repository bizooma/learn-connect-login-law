import { useState } from "react";
import { ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WikiCategory } from "@/hooks/useWikiCategories";
import { WikiArticle } from "@/hooks/useWikiArticles";
import WikiArticleList from "./WikiArticleList";
import { getSubjectCategoryMeta } from "./subjectCategoryMeta";

interface WikiCategoryRowProps {
  category: WikiCategory;
  onEdit: (category: WikiCategory) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (category: WikiCategory) => void;
  onEditArticle: (article: WikiArticle) => void;
  searchQuery?: string;
  defaultExpanded?: boolean;
}

const WikiCategoryRow = ({ category, onEdit, onDelete, onTogglePublish, onEditArticle, searchQuery, defaultExpanded }: WikiCategoryRowProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const count = category.article_count || 0;
  const meta = getSubjectCategoryMeta(category.category);
  const CategoryIcon = meta.Icon;

  return (
    <div className="border-b border-border">
      <div
        className="grid grid-cols-[1fr_100px_140px_100px_60px] items-center gap-4 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <CategoryIcon className={`h-5 w-5 shrink-0 ${meta.iconColor}`} />
          <span className="font-medium text-foreground truncate">{category.title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${meta.badgeClass}`}>
          {meta.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded w-fit ${category.is_published ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground'}`}>
          {category.is_published ? 'Published' : 'Draft'}
        </span>
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePublish(category); }}>
                {category.is_published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {category.is_published ? "Unpublish" : "Publish"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <WikiArticleList
          categoryId={category.id}
          onEditArticle={onEditArticle}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default WikiCategoryRow;
