import { FileText, MoreVertical, Eye, EyeOff, Pencil, Trash2, Shield, ScrollText, Upload, GitBranch, Video, FileUp, ListChecks, ClipboardCheck, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WikiArticle, contentTypeLabels, WikiContentType } from "@/hooks/useWikiArticles";
import WikiPagesList from "./WikiPagesList";

interface WikiArticleRowProps {
  article: WikiArticle;
  onEdit: (article: WikiArticle) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (article: WikiArticle) => void;
  selectedTags?: string[];
}

const contentTypeIcons: Record<WikiContentType, typeof FileText> = {
  document: FileText,
  flowchart: GitBranch,
  video: Video,
  file: FileUp,
  checklist: ListChecks,
  test: ClipboardCheck,
  policy: Shield,
  procedure: ScrollText,
};


const WikiArticleRow = ({ article, onEdit, onDelete, onTogglePublish, selectedTags }: WikiArticleRowProps) => {
  const Icon = contentTypeIcons[article.content_type] || FileText;
  const typeLabel = contentTypeLabels[article.content_type] || "Item";
  const isDocument = article.content_type === "document";
  const dimmed = !!(selectedTags && selectedTags.length > 0 && !(article.tags || []).some((t) => selectedTags.includes(t)));

  return (
    <div>
      <div
        className={`flex items-center justify-between px-4 py-3 pl-12 bg-muted/30 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${dimmed ? "opacity-40" : ""}`}
        onClick={() => onEdit(article)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{article.title}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {typeLabel}
          </span>
          {!article.is_published && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Draft</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {article.tags?.map((tag) => {
            const active = selectedTags?.includes(tag);
            return (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={
                  active
                    ? { backgroundColor: "#FFDA00", color: "#000", border: "1px solid #000" }
                    : { backgroundColor: "#FFDA00", color: "#000" }
                }
              >
                {tag}
              </span>
            );
          })}
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
      {isDocument && <WikiPagesList articleId={article.id} />}
    </div>
  );
};

export default WikiArticleRow;
