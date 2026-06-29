import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useWikiPages, WikiPage } from "@/hooks/useWikiPages";

interface EditPageDialogProps {
  page: WikiPage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditPageDialog = ({ page, open, onOpenChange }: EditPageDialogProps) => {
  const { updatePage } = useWikiPages(page?.article_id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content || "");
    }
  }, [page]);

  const handleSave = () => {
    if (!page) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    updatePage.mutate(
      { id: page.id, title: trimmed, content },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={250}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="page-content">Content</Label>
            <Textarea
              id="page-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Write the page content..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updatePage.isPending || !title.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPageDialog;
