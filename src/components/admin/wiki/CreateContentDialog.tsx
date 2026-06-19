import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWikiArticles, contentTypeLabels, type WikiContentType, type WikiSubjectKind } from "@/hooks/useWikiArticles";
import { SUBJECT_CATEGORIES } from "./subjectCategoryMeta";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  title: string;
  category?: WikiSubjectKind;
}

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: WikiContentType | null;
  categories: Category[];
  defaultCategoryId?: string | null;
}

const STUB_TYPES: WikiContentType[] = ["flowchart", "checklist", "test"];

const CreateContentDialog = ({
  open,
  onOpenChange,
  contentType,
  categories,
  defaultCategoryId,
}: CreateContentDialogProps) => {
  const { createArticle } = useWikiArticles();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subjectKind, setSubjectKind] = useState<WikiSubjectKind>("company");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setVideoUrl("");
      setFileUrl("");
      setFileName("");
      const initialId = defaultCategoryId || categories[0]?.id || "";
      setCategoryId(initialId);
      const initialCat = categories.find((c) => c.id === initialId);
      setSubjectKind(initialCat?.category || "company");
    }
  }, [open, defaultCategoryId, categories]);

  // Keep kind in sync when subject changes
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat?.category) setSubjectKind(cat.category);
  }, [categoryId, categories]);

  if (!contentType) return null;

  const label = contentTypeLabels[contentType];
  const isStub = STUB_TYPES.includes(contentType);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const ext = f.name.split(".").pop();
      const path = `wiki-documents/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("admin-resources").upload(path, f);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("admin-resources").getPublicUrl(path);
      setFileUrl(urlData.publicUrl);
      setFileName(f.name);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = () => {
    if (!categoryId) {
      toast.error("Please select a Subject");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (contentType === "file" && !fileUrl) {
      toast.error("Please upload a file");
      return;
    }

    createArticle.mutate(
      {
        category_id: categoryId,
        title: title.trim(),
        content_type: contentType,
        content: contentType === "video" ? videoUrl : undefined,
        file_url: contentType === "file" ? fileUrl : undefined,
        file_name: contentType === "file" ? fileName : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create {label}</DialogTitle>
          <DialogDescription>
            {isStub
              ? `${label} editor is coming soon — this will create a placeholder entry.`
              : `Add a new ${label.toLowerCase()} to a Subject.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cc-subject">Subject</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="cc-subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-title">Title</Label>
            <Input
              id="cc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${label} title`}
            />
          </div>

          {contentType === "video" && (
            <div className="space-y-2">
              <Label htmlFor="cc-video">Video URL</Label>
              <Input
                id="cc-video"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {contentType === "file" && (
            <div className="space-y-2">
              <Label>File</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.pptx,.ppt"
              />
              {fileUrl ? (
                <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-muted/30">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{fileName}</span>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    Replace
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload File"}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createArticle.isPending}>
            Create {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentDialog;
