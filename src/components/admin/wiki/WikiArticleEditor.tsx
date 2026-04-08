import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { WikiArticle, contentTypeLabels } from "@/hooks/useWikiArticles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WikiArticleEditorProps {
  article: WikiArticle;
  onSave: (updates: { id: string; title?: string; content?: string; tags?: string[]; is_published?: boolean; file_url?: string; file_name?: string }) => void;
  onBack: () => void;
}

const WikiArticleEditor = ({ article, onSave, onBack }: WikiArticleEditorProps) => {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content || "");
  const [tagsInput, setTagsInput] = useState(article.tags?.join(", ") || "");
  const [isPublished, setIsPublished] = useState(article.is_published);
  const [showPreview, setShowPreview] = useState(false);
  const [fileUrl, setFileUrl] = useState(article.file_url || "");
  const [fileName, setFileName] = useState(article.file_name || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDocument = article.content_type === "document";
  const typeLabel = contentTypeLabels[article.content_type] || "Item";

  useEffect(() => {
    setTitle(article.title);
    setContent(article.content || "");
    setTagsInput(article.tags?.join(", ") || "");
    setIsPublished(article.is_published);
    setFileUrl(article.file_url || "");
    setFileName(article.file_name || "");
  }, [article]);

  const handleSave = () => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ id: article.id, title, content, tags, is_published: isPublished, file_url: fileUrl || undefined, file_name: fileName || undefined });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `wiki-documents/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("admin-resources")
        .getPublicUrl(filePath);

      setFileUrl(urlData.publicUrl);
      setFileName(file.name);
      toast.success("File uploaded");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.pptx,.ppt"
      />

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{typeLabel}</span>
          {!isDocument && (
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Edit" : "Preview"}
            </Button>
          )}
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg p-6 space-y-4">
        <div>
          <Label htmlFor="article-title">Title</Label>
          <Input id="article-title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <Label htmlFor="article-tags">Tags (comma-separated)</Label>
            <Input id="article-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., HR, Onboarding" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Label htmlFor="article-published">Published</Label>
            <Switch id="article-published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>

        {isDocument ? (
          <div className="space-y-3">
            <Label>Attached Document</Label>
            {fileUrl ? (
              <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName || "Uploaded file"}</p>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Open document <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Replace"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            )}
            <div>
              <Label htmlFor="article-content">Notes (optional, Markdown)</Label>
              <Textarea
                id="article-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
                placeholder="Add any notes about this document..."
              />
            </div>
          </div>
        ) : showPreview ? (
          <div className="border border-border rounded-lg p-4 min-h-[400px]">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <div>
            <Label htmlFor="article-content">Content (Markdown)</Label>
            <Textarea
              id="article-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder={`Write your ${typeLabel.toLowerCase()} content here using Markdown...`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiArticleEditor;
