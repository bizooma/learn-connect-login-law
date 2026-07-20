import { useState } from "react";
import { Sparkles, Loader2, Send, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { withPreviewAsStaffParam } from "@/hooks/usePreviewAsStaff";

interface AskThisSopPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle?: string;
}

interface SourcePage {
  id: string;
  title: string;
}

const QUICK_ACTIONS = [
  "What should I have learned from this SOP?",
  "Key rules, numbers, and deadlines",
  "Step-by-step process",
  "Common mistakes to avoid",
];

const AskThisSopPanel = ({ open, onOpenChange, articleId, articleTitle }: AskThisSopPanelProps) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SourcePage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setSources([]);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ask-wiki-sop", {
        body: { articleId, question: q.trim() },
      });
      if (fnErr) throw fnErr;
      if ((data as any)?.error) throw new Error((data as any).error);

      const ids: string[] = (data as any)?.sourcePageIds || [];
      setAnswer((data as any)?.answer || "");

      if (ids.length > 0) {
        const { data: pages } = await supabase
          .from("wiki_pages" as any)
          .select("id, title")
          .in("id", ids);
        const map = new Map((pages || []).map((p: any) => [p.id, p.title]));
        setSources(ids.map((id) => ({ id, title: (map.get(id) as string) || "Page" })));
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to get answer";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(question);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b" style={{ backgroundColor: "#FFDA00" }}>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5" /> Ask this SOP
          </SheetTitle>
          <SheetDescription className="text-foreground/80">
            Answers come only from{articleTitle ? ` "${articleTitle}"` : " this document"}.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuestion(q);
                  ask(q);
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!answer && !loading && !error && (
            <p className="text-sm text-muted-foreground">
              Ask a question about this SOP. The AI will only use this document's contents and will
              cite the pages it drew from.
            </p>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading the SOP...
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-md p-3">
              {error}
            </div>
          )}

          {answer && (
            <div className="space-y-3">
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {answer}
              </div>
              {sources.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s) => (
                      <Link
                        key={s.id}
                        to={withPreviewAsStaffParam(`/admin/wiki/pages/${s.id}`)}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border hover:border-foreground/40 bg-background transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate max-w-[220px]">{s.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t px-6 py-3 space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about this SOP..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                ask(question);
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !question.trim()}
              className="gap-2"
              style={{ backgroundColor: "#213C82" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ask
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AskThisSopPanel;
