import { useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWikiPages } from "@/hooks/useWikiPages";
import { usePreviewAsStaff } from "@/hooks/usePreviewAsStaff";

interface WikiPagesListProps {
  articleId: string;
}

const PageInput = ({ articleId, onCreated }: { articleId: string; onCreated: () => void }) => {
  const [title, setTitle] = useState("");
  const { createPage } = useWikiPages(articleId);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createPage.mutate(
      { article_id: articleId, title: trimmed },
      {
        onSuccess: () => {
          setTitle("");
          onCreated();
        },
      }
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 pl-16 bg-background border-b border-border">
      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Page</span>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Enter page title"
        maxLength={250}
        className="flex-1 h-8 text-sm"
        onClick={(e) => e.stopPropagation()}
      />
      {title.trim() && (
        <>
          <span className="text-xs text-muted-foreground">{title.length}/250</span>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              submit();
            }}
            disabled={createPage.isPending}
          >
            Create
          </Button>
        </>
      )}
    </div>
  );
};

const WikiPagesList = ({ articleId }: WikiPagesListProps) => {
  const { pages, deletePage } = useWikiPages(articleId);
  const [, force] = useState(0);
  const navigate = useNavigate();
  const { enabled: previewAsStaff } = usePreviewAsStaff();

  const openEditor = (id: string) => navigate(`/admin/wiki/pages/${id}`);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {pages.map((page) => (
        <div
          key={page.id}
          className="flex items-center justify-between px-4 py-2 pl-16 bg-background border-b border-border hover:bg-muted/30 group cursor-pointer"
          onClick={() => openEditor(page.id)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Page</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{page.title}</span>
          </div>
          {!previewAsStaff && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditor(page.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage.mutate(page.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      ))}
      {!previewAsStaff && <PageInput articleId={articleId} onCreated={() => force((n) => n + 1)} />}
    </div>
  );
};

export default WikiPagesList;
