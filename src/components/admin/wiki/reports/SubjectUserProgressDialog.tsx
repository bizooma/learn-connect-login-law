import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User as UserIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import CompletionBar from "./CompletionBar";
import { useWikiRequirementReports } from "@/hooks/useWikiRequirementReports";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categoryId: string | null;
  categoryTitle: string;
}

const statusLabel: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const SubjectUserProgressDialog = ({ open, onOpenChange, categoryId, categoryTitle }: Props) => {
  const { data, isLoading } = useWikiRequirementReports();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!data || !categoryId) return [];
    const uids = data.requiredBySubject.get(categoryId);
    if (!uids) return [];
    const cellMap = new Map(
      data.cells
        .filter((c) => c.category_id === categoryId)
        .map((c) => [c.user_id, c])
    );
    const out = Array.from(uids).map((uid) => {
      const p = data.peopleById.get(uid);
      const cell = cellMap.get(uid);
      return {
        user_id: uid,
        name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : "Unknown",
        email: p?.email ?? "",
        avatar: p?.profile_image_url ?? null,
        pct: cell?.progress_pct ?? 0,
        status: cell?.status ?? "not_started",
      };
    });
    out.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
    const q = search.trim().toLowerCase();
    return q ? out.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)) : out;
  }, [data, categoryId, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{categoryTitle} — Completion by user</DialogTitle>
        </DialogHeader>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="pl-9"
          />
        </div>
        <div className="flex-1 overflow-auto border border-border rounded-md">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users assigned.</div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.user_id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {r.avatar ? <AvatarImage src={r.avatar} alt={r.name} /> : null}
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{statusLabel[r.status] ?? r.status}</Badge>
                  <div className="w-40">
                    <CompletionBar pct={r.pct} />
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

export default SubjectUserProgressDialog;
