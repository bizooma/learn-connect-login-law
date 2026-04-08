import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MarkdownRenderer from "@/components/ui/markdown-renderer";
import { WikiArticle } from "@/hooks/useWikiArticles";

interface WikiArticleEditorProps {
  article: WikiArticle;
  onSave: (updates: { id: string; title?: string; content?: string; tags?: string[]; is_published?: boolean }) => void;
  onBack: () => void;
}

const WikiArticleEditor = ({ article, onSave, onBack }: WikiArticleEditorProps) => {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content || "");
  const [tagsInput, setTagsInput] = useState(article.tags?.join(", ") || "");
  const [isPublished, setIsPublished] = useState(article.is_published);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setTitle(article.title);
    setContent(article.content || "");
    setTagsInput(article.tags?.join(", ") || "");
    setIsPublished(article.is_published);
  }, [article]);

  const handleSave = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ id: article.id, title, content, tags, is_published: isPublished });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to list
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Edit" : "Preview"}
          </Button>
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
            <Input id="article-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., Subject, Process" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Label htmlFor="article-published">Published</Label>
            <Switch id="article-published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>

        {showPreview ? (
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
              placeholder="Write your article content here using Markdown..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiArticleEditor;
