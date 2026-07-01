import { useEffect, useMemo, useState, Fragment } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { useWikiRequirementReports, SubjectRow } from "@/hooks/useWikiRequirementReports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Download, BookOpen, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  ChevronRight as ChevronExpand, ChevronDown, ShieldCheck, User as UserIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";
import CompletionBar from "@/components/admin/wiki/reports/CompletionBar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return "—"; }
};

type SortKey = "name" | "required" | "completion" | "updated";
const PAGE_SIZE = 25;

const AdminWikiReportsContent = () => {
  const { data, isLoading } = useWikiRequirementReports();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minReq, setMinReq] = useState(0);

  const cols = useResizableColumns({
    storageKey: "report-content-cols-v2",
    defaults: [40, 340, 120, 260, 90, 200, 130],
  });

  const rows: SubjectRow[] = data?.subjects ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
      if (verifiedOnly && !r.is_published) return false;
      if (r.required_count < minReq) return false;
      return true;
    });
  }, [rows, search, verifiedOnly, minReq]);

  const sorted = useMemo(() => {
    const sign = sortDir === "asc" ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "name") return sign * a.title.localeCompare(b.title);
      if (sortKey === "required") return sign * (a.required_count - b.required_count);
      if (sortKey === "completion") return sign * (a.avg_pct - b.avg_pct);
      return sign * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, verifiedOnly, minReq, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const toggleExpand = (id: string) => {
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const drillRows = (categoryId: string) => {
    if (!data) return [];
    const uids = data.requiredBySubject.get(categoryId);
    if (!uids) return [];
    const cellMap = new Map(
      data.cells.filter((c) => c.category_id === categoryId).map((c) => [c.user_id, c])
    );
    const out = Array.from(uids).map((uid) => {
      const p = data.peopleById.get(uid);
      const cell = cellMap.get(uid);
      return {
        user_id: uid,
        name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : "Unknown",
        avatar: p?.profile_image_url ?? null,
        job_title: p?.job_title ?? "",
        pct: cell?.progress_pct ?? 0,
        status: cell?.status ?? "not_started",
      };
    });
    out.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
    return out;
  };

  const exportCsv = () => {
    const headers = ["Subject", "Required for", "Avg completion %", "Last updated", "Verified"];
    const csvRows = sorted.map((r) => [
      r.title, r.required_count, `${r.avg_pct}%`, formatDate(r.updated_at), r.is_published ? "Yes" : "No",
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `content-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = (verifiedOnly ? 1 : 0) + (minReq > 0 ? 1 : 0);

  return (
    <ReportsShell
      title="Content report"
      subtitle="Sort, filter and view completion scores for your content – or drill down to see completion by user."
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filter {activeFilters > 0 && <Badge variant="secondary">{activeFilters}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox id="verified-only" checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
                <Label htmlFor="verified-only" className="text-sm cursor-pointer">Verified subjects only</Label>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Minimum required users</Label>
                <Input type="number" min={0} value={minReq} onChange={(e) => setMinReq(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1" />
              </div>
              {activeFilters > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { setVerifiedOnly(false); setMinReq(0); }}>Clear all</Button>
              )}
            </PopoverContent>
          </Popover>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subjects..." className="pl-9" />
          </div>
        </div>
        <Button onClick={exportCsv} className="gap-2" disabled={sorted.length === 0}>
          <Download className="h-4 w-4" /> Download .csv
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <ResizableHead width={cols.widths[0]}> </ResizableHead>
              <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 font-semibold">
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>
                <button onClick={() => toggleSort("required")} className="flex items-center gap-1 font-semibold">
                  Required for <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>
                <button onClick={() => toggleSort("completion")} className="flex items-center gap-1 font-semibold">
                  Avg. completion <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>%</ResizableHead>
              <ResizableHead width={cols.widths[5]} onResize={cols.onMouseDown(5)}>
                <button onClick={() => toggleSort("updated")} className="flex items-center gap-1 font-semibold">
                  Last updated <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[6]}>Verification</ResizableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No subjects found.</TableCell></TableRow>
            ) : (
              pageRows.map((r) => {
                const isOpen = expanded.has(r.id);
                const drill = isOpen ? drillRows(r.id) : [];
                return (
                  <Fragment key={r.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(r.id)}>
                      <TableCell>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronExpand className="h-4 w-4" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{r.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {r.required_count} {r.required_count === 1 ? "user" : "users"}
                      </TableCell>
                      <TableCell><CompletionBar pct={r.avg_pct} showLabel={false} /></TableCell>
                      <TableCell className="font-medium tabular-nums">{r.avg_pct}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(r.updated_at)}</TableCell>
                      <TableCell>
                        {r.is_published ? (
                          <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-0">
                          <div className="p-4">
                            {drill.length === 0 ? (
                              <div className="text-sm text-muted-foreground text-center py-4">No users required for this subject.</div>
                            ) : (
                              <ul className="divide-y divide-border rounded-md border border-border bg-card">
                                {drill.map((u) => (
                                  <li key={u.user_id} className="p-2 flex items-center gap-3">
                                    <Avatar className="h-7 w-7">
                                      {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                                      <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">{u.name}</div>
                                      {u.job_title && <div className="text-xs text-muted-foreground truncate">{u.job_title}</div>}
                                    </div>
                                    <div className="w-48"><CompletionBar pct={u.pct} /></div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm text-muted-foreground">
          <div>
            {sorted.length === 0 ? "0 results" :
              `${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length}`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </ReportsShell>
  );
};

export default AdminWikiReportsContent;
