import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WikiSubjectCategory } from "@/hooks/useWikiCategories";
import { SUBJECT_CATEGORIES } from "./subjectCategoryMeta";

interface WikiCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { title: string; description?: string; icon_name?: string; is_published?: boolean; category?: WikiSubjectCategory }) => void;
  initialData?: { title: string; description?: string; icon_name?: string; is_published?: boolean; category?: WikiSubjectCategory };
  mode: "create" | "edit";
}

const WikiCategoryDialog = ({ open, onOpenChange, onSave, initialData, mode }: WikiCategoryDialogProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);
  const [category, setCategory] = useState<WikiSubjectCategory>(initialData?.category || "company");

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setIsPublished(initialData?.is_published ?? true);
      setCategory(initialData?.category || "company");
    }
  }, [open, initialData]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      is_published: isPublished,
      category,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Subject" : "Edit Subject"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-title">Title</Label>
            <Input id="cat-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Opening a New Case" />
          </div>
          <div>
            <Label htmlFor="cat-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as WikiSubjectCategory)}>
              <SelectTrigger id="cat-category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <c.Icon className={`h-4 w-4 ${c.iconColor}`} />
                      <span>{c.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Pick what kind of subject this is. Used to group content as Company, Policy, or Procedure.
            </p>
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this subject" rows={3} />
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
