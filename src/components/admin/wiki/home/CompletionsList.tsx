import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { usePeopleReport } from "@/hooks/useWikiReports";

const PAGE_SIZE = 8;

const initials = (first?: string | null, last?: string | null, email?: string) => {
  const a = (first || "").trim()[0];
  const b = (last || "").trim()[0];
  if (a || b) return `${a ?? ""}${b ?? ""}`.toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
};

const CompletionsList = () => {
  const { data, isLoading } = usePeopleReport();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortByName, setSortByName] = useState(true);

  const filtered = useMemo(() => {
    const rows = data || [];
    const q = search.toLowerCase();
    const matched = q
      ? rows.filter((r) =>
          [r.first_name, r.last_name, r.email].some((v) => (v ?? "").toLowerCase().includes(q))
        )
      : rows;
    return [...matched].sort((a, b) => {
      if (sortByName) {
        const an = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email;
        const bn = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || b.email;
        return an.localeCompare(bn);
      }
      return b.read_pct - a.read_pct;
    });
  }, [data, search, sortByName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Completions</h3>
        <button
          onClick={() => setSortByName((s) => !s)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Sort: <span className="text-foreground font-medium">{sortByName ? "Name" : "Progress"}</span>
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search people"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9 h-9"
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : pageRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No people found.</p>
      ) : (
        <ul className="divide-y divide-border">
          {pageRows.map((row) => {
            const name =
              `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email;
            const complete = row.read_pct >= 100;
            return (
              <li key={row.user_id} className="flex items-center gap-3 py-2.5">
                <div className="h-8 w-8 rounded-full bg-muted text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials(row.first_name, row.last_name, row.email)}
                </div>
                <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{name}</p>
                {complete ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    {row.read_pct === 0 ? "Not started" : "In progress"}
                  </Badge>
                )}
                <span className="text-sm font-semibold text-foreground w-12 text-right">
                  {row.read_pct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CompletionsList;
