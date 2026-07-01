import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import CompletionBar from "./CompletionBar";
import { Badge } from "@/components/ui/badge";
import { useWikiRequirementReports } from "@/hooks/useWikiRequirementReports";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string | null;
  userName: string;
}

const statusLabel: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const UserRequiredSubjectsDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const { data, isLoading } = useWikiRequirementReports();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!data || !userId) return [];
    const cids = data.requiredByUser.get(userId);
    if (!cids) return [];
    const cellMap = new Map(
      data.cells.filter((c) => c.user_id === userId).map((c) => [c.category_id, c])
    );
    const out = Array.from(cids).map((cid) => {
      const meta = data.subjectMeta.get(cid);
      const cell = cellMap.get(cid);
      return {
        id: cid,
        title: meta?.title ?? "Unknown subject",
        pct: cell?.progress_pct ?? 0,
        status: cell?.status ?? "not_started",
      };
    });
    out.sort((a, b) => b.pct - a.pct || a.title.localeCompare(b.title));
    const q = search.trim().toLowerCase();
    return q ? out.filter((r) => r.title.toLowerCase().includes(q)) : out;
  }, [data, userId, search]);

  const overall = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{userName} — Required subjects</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-sm flex-1">
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
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No required subjects.</div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 font-medium text-sm truncate">{r.title}</div>
                    <Badge variant="outline" className="text-xs">{statusLabel[r.status] ?? r.status}</Badge>
                    <div className="w-40">
                      <CompletionBar pct={r.pct} />
                    </div>
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

export default UserRequiredSubjectsDialog;
