import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

interface SubjectProgress {
  id: string;
  title: string;
  total: number;
  read: number;
  pct: number;
}

export const UserSubjectProgressDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SubjectProgress[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: cats }, { data: articles }, { data: views }] = await Promise.all([
        supabase.from("wiki_categories").select("id, title").eq("is_published", true),
        supabase.from("wiki_articles").select("id, category_id").eq("is_published", true),
        supabase.from("wiki_article_views").select("article_id").eq("user_id", userId),
      ]);
      if (!active) return;
      const articleToCat = new Map<string, string>();
      (articles ?? []).forEach((a: any) => articleToCat.set(a.id, a.category_id));
      const viewedArticles = new Set((views ?? []).map((v: any) => v.article_id));

      const totals = new Map<string, number>();
      const reads = new Map<string, number>();
      (articles ?? []).forEach((a: any) => {
        totals.set(a.category_id, (totals.get(a.category_id) ?? 0) + 1);
      });
      viewedArticles.forEach((aid) => {
        const cid = articleToCat.get(aid);
        if (!cid) return;
        reads.set(cid, (reads.get(cid) ?? 0) + 1);
      });

      const out: SubjectProgress[] = (cats ?? []).map((c: any) => {
        const total = totals.get(c.id) ?? 0;
        const read = Math.min(reads.get(c.id) ?? 0, total);
        const pct = total > 0 ? Math.round((read / total) * 100) : 0;
        return { id: c.id, title: c.title, total, read, pct };
      });
      out.sort((a, b) => b.pct - a.pct || a.title.localeCompare(b.title));
      setRows(out);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const overall = useMemo(() => {
    const totalAll = rows.reduce((s, r) => s + r.total, 0);
    const readAll = rows.reduce((s, r) => s + r.read, 0);
    return totalAll > 0 ? Math.round((readAll / totalAll) * 100) : 0;
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{userName} — Subject progress</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Overall: <span className="font-semibold text-foreground">{overall}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No subjects found.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((r) => (
                <li key={r.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-sm flex-1 truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {r.read} / {r.total} read
                    </div>
                    <div className="text-sm font-semibold w-12 text-right">{r.pct}%</div>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.pct >= 80 ? "bg-emerald-500" : r.pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSubjectProgressDialog;
