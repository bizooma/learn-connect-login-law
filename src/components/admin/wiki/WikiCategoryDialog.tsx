import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface WikiCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; description?: string; icon_name?: string; is_published?: boolean }) => void;
  initialData?: { title: string; description?: string; icon_name?: string; is_published?: boolean };
  mode: "create" | "edit";
}

const WikiCategoryDialog = ({ open, onOpenChange, onSave, initialData, mode }: WikiCategoryDialogProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined, is_published: isPublished });
    if (mode === "create") {
      setTitle("");
      setDescription("");
      setIsPublished(true);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Category" : "Edit Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-title">Title</Label>
            <Input id="cat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Opening a New Case" />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this category" rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-published">Published</Label>
            <Switch id="cat-published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WikiCategoryDialog;
