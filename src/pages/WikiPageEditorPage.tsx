import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/wiki/RichTextEditor";
import { useWikiPages, WikiPage } from "@/hooks/useWikiPages";

// Strip legacy bold so old content renders at normal weight.
// Removes <strong>/<b> wrappers and inline font-weight styles.
const sanitizeContent = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<\/?(strong|b)(\s[^>]*)?>/gi, "")
    .replace(/font-weight\s*:\s*[^;"']+;?/gi, "");
};

const WikiPageEditorPage = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { updatePage } = useWikiPages(page?.article_id);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!pageId) return;
      const { data, error } = await supabase
        .from("wiki_pages" as any)
        .select("*")
        .eq("id", pageId)
        .single();
      if (!active) return;
      if (error) {
        toast.error("Failed to load page");
        navigate(-1);
        return;
      }
      const p = data as unknown as WikiPage;
      setPage(p);
      setTitle(p.title);
      setContent(sanitizeContent(p.content || ""));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [pageId, navigate]);

  const handleSave = async () => {
    if (!page) return;
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("wiki_pages" as any)
      .update({ title: trimmed, content: sanitizeContent(content) })
      .eq("id", page.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    setDirty(false);
    toast.success("Page saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/wiki")}
              className="gap-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Content
            </Button>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-2"
              placeholder="Page title"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {dirty ? "Unsaved changes" : "Saved"}
            </span>
            <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <RichTextEditor
          content={content}
          onChange={(html) => {
            setContent(html);
            setDirty(true);
          }}
        />
      </div>
    </div>
  );
};

export default WikiPageEditorPage;
