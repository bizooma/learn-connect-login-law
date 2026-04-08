import { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, MoreVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
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

  return (
    <div className="border-b border-border">
      <div
        className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FolderOpen className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">{category.title}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {count} {count === 1 ? "item" : "items"}
          </span>
          {!category.is_published && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Draft</span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
