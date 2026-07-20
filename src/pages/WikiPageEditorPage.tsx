import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import birdIcon from "@/assets/bird.png";
import { toast } from "sonner";
import RichTextEditor from "@/components/admin/wiki/RichTextEditor";
import AiWritePageDialog from "@/components/admin/wiki/AiWritePageDialog";
import WikiDocumentSidebar from "@/components/admin/wiki/WikiDocumentSidebar";
import PreviewAsStaffBanner from "@/components/admin/wiki/PreviewAsStaffBanner";
import { isPreviewAsStaffActive, registerPreviewEnableGuard, usePreviewAsStaff, withPreviewAsStaffParam } from "@/hooks/usePreviewAsStaff";
import { WikiPage } from "@/hooks/useWikiPages";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";


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
  const [aiOpen, setAiOpen] = useState(false);

  const { isAdmin, isOwner } = useUserRole();
  const { enabled: previewAsStaff } = usePreviewAsStaff();
  // If preview flipped on in another tab while we hold unsaved edits, keep
  // this tab editable so we don't silently drop work.
  const [keepEditable, setKeepEditable] = useState(false);
  const canUseAi = (isAdmin || isOwner) && !previewAsStaff;
  const readOnly = previewAsStaff && !keepEditable;


  const { data: currentArticle } = useQuery({
    queryKey: ["wiki-page-current-article", page?.article_id],
    enabled: !!page?.article_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wiki_articles")
        .select("id, category_id")
        .eq("id", page!.article_id)
        .single();
      if (error) throw error;
      return data as { id: string; category_id: string };
    },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!pageId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPage(null);
      setTitle("");
      setContent("");
      setDirty(false);

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
      // Only genuine staff learners should have completions recorded.
      // Skip for admins/owners (reviewing content) and for staff-preview mode.
      if (!previewAsStaff && !isAdmin && !isOwner) {
        supabase.rpc("mark_wiki_page_complete" as any, { page_id: p.id }).then(({ error }) => {
          if (error) console.warn("mark_wiki_page_complete failed", error);
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [pageId, navigate, previewAsStaff, isAdmin, isOwner]);

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

  // Same-tab guard: if the admin toggles preview while holding unsaved edits,
  // confirm before flipping. Cancelling aborts the flip and preserves the buffer.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    return registerPreviewEnableGuard(() => {
      if (!dirtyRef.current) return true;
      return window.confirm(
        "You have unsaved changes. Enter preview and discard them? OK to continue, Cancel to keep editing."
      );
    });
  }, []);

  // Cross-tab: preview enabled elsewhere while dirty — keep this tab editable.
  const prevPreviewRef = useRef(previewAsStaff);
  useEffect(() => {
    const prev = prevPreviewRef.current;
    prevPreviewRef.current = previewAsStaff;
    if (!prev && previewAsStaff && dirty) {
      setKeepEditable(true);
      toast.info(
        "Preview enabled in another tab — this tab kept editable to protect unsaved changes."
      );
    }
    if (!previewAsStaff && keepEditable) setKeepEditable(false);
  }, [previewAsStaff, dirty, keepEditable]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const confirmNavigation = () => {
    if (!dirty || previewAsStaff || isPreviewAsStaffActive()) return true;
    return window.confirm("You have unsaved changes. Leave without saving?");
  };

  const handleBackToContent = () => {
    if (!confirmNavigation()) return;
    navigate(withPreviewAsStaffParam("/admin/wiki/content"), {
      state: { activeCategoryId: currentArticle?.category_id ?? null },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <PreviewAsStaffBanner />
      <div className="flex flex-1 min-h-0">
        <WikiDocumentSidebar
          categoryId={currentArticle?.category_id}
          activeArticleId={page?.article_id}
          activePageId={page?.id}
          onBeforeNavigate={confirmNavigation}
        />


        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-border bg-background">
            <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto w-full">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToContent}
                  className="gap-2 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Content
                </Button>
                {readOnly ? (
                  <h1 className="text-lg font-semibold truncate px-2">{title}</h1>
                ) : (
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setDirty(true);
                    }}
                    className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-2"
                    placeholder="Page title"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canUseAi && (
                  <Button
                    size="sm"
                    onClick={() => setAiOpen(true)}
                    className="gap-2 text-white hover:opacity-90"
                    style={{ backgroundColor: "#213C82" }}
                  >
                    <img src={birdIcon} alt="" className="h-7 w-7" /> Write with AI
                  </Button>
                )}
                {!readOnly && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {dirty ? "Unsaved changes" : "Saved"}
                    </span>
                    <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <RichTextEditor
              key={page?.id || pageId}
              content={content}
              onChange={(html) => {
                if (readOnly) return;
                setContent(html);
                setDirty(true);
              }}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>


      {canUseAi && (
        <AiWritePageDialog
          open={aiOpen}
          onOpenChange={setAiOpen}
          pageTitle={title}
          currentContent={content}
          onInsert={(next) => {
            setContent(next);
            setDirty(true);
          }}
        />
      )}

    </div>
  );
};

export default WikiPageEditorPage;
