import { FileText, MoreVertical, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WikiArticle } from "@/hooks/useWikiArticles";

interface WikiArticleRowProps {
  article: WikiArticle;
  onEdit: (article: WikiArticle) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (article: WikiArticle) => void;
}

const WikiArticleRow = ({ article, onEdit, onDelete, onTogglePublish }: WikiArticleRowProps) => {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 pl-12 bg-muted/30 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onEdit(article)}
    >
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{article.title}</span>
        {!article.is_published && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Draft</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {article.tags?.map((tag) => (
          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(article); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePublish(article); }}>
              {article.is_published ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {article.is_published ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(article.id); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default WikiArticleRow;
