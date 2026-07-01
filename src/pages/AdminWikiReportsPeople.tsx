import { useEffect, useMemo, useState } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { useWikiRequirementReports, PersonRow } from "@/hooks/useWikiRequirementReports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Download, User, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";
import { useOrgPeopleSettings } from "@/hooks/useOrgPeopleSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import CompletionBar from "@/components/admin/wiki/reports/CompletionBar";
import UserRequiredSubjectsDialog from "@/components/admin/wiki/reports/UserRequiredSubjectsDialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formatDate = (iso: string | null) => {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return "—"; }
};

type SortKey = "name" | "completion" | "last_login";
const PAGE_SIZE = 25;

const AdminWikiReportsPeople = () => {
  const { data, isLoading } = useWikiRequirementReports();
  const { settings } = useOrgPeopleSettings();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("completion");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [directReportIds, setDirectReportIds] = useState<string[] | null>(null);
  const [detailsUser, setDetailsUser] = useState<{ id: string; name: string } | null>(null);
  const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());
  const [roleFilter, setRoleFilter] = useState<Set<string>>(new Set());

  const cols = useResizableColumns({
    storageKey: "report-people-cols-v2",
    defaults: [300, 220, 130, 200, 240, 120],
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (isAdmin || !settings.shareReportsWithDirectReports) {
        setDirectReportIds(null); return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) { if (active) setDirectReportIds([]); return; }
      const { data: reports } = await supabase.from("profiles").select("id").eq("manager_id", uid);
      if (active) setDirectReportIds((reports ?? []).map((r: any) => r.id));
    })();
    return () => { active = false; };
  }, [isAdmin, settings.shareReportsWithDirectReports]);

  const rows = data?.people ?? [];

  const allGroups = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => r.groups.forEach((g) => m.set(g.id, g.name)));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const allRoles = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.job_title && s.add(r.job_title));
    return Array.from(s).sort();
  }, [rows]);

  const scoped = useMemo(() => {
    if (directReportIds === null) return rows;
    const allow = new Set(directReportIds);
    return rows.filter((r) => allow.has(r.user_id));
  }, [rows, directReportIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((r) => {
      const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.toLowerCase();
      if (q && !(name.includes(q) || r.email.toLowerCase().includes(q) || (r.job_title ?? "").toLowerCase().includes(q))) return false;
      if (groupFilter.size > 0 && !r.groups.some((g) => groupFilter.has(g.id))) return false;
      if (roleFilter.size > 0 && !(r.job_title && roleFilter.has(r.job_title))) return false;
      return true;
    });
  }, [scoped, search, groupFilter, roleFilter]);

  const sorted = useMemo(() => {
    const sign = sortDir === "asc" ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "name") {
        const an = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() || a.email;
        const bn = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim() || b.email;
        return sign * an.localeCompare(bn);
      }
      if (sortKey === "completion") return sign * (a.avg_pct - b.avg_pct);
      const at = a.last_login ? new Date(a.last_login).getTime() : 0;
      const bt = b.last_login ? new Date(b.last_login).getTime() : 0;
      return sign * (at - bt);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, groupFilter, roleFilter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const exportCsv = () => {
    const headers = ["Name", "Email", "Job Title", "Groups", "Required Subjects", "Avg %", "Last Login"];
    const csvRows = sorted.map((r) => [
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      r.email, r.job_title ?? "",
      r.groups.map((g) => g.name).join("; "),
      r.required_count, `${r.avg_pct}%`, formatDate(r.last_login),
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `people-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = groupFilter.size + roleFilter.size;

  return (
    <ReportsShell
      title="People report"
      subtitle="Check out everyone's progress and see what they're up to in real time."
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filters {activeFilters > 0 && <Badge variant="secondary">{activeFilters}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 max-h-96 overflow-auto space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Groups</div>
                {allGroups.length === 0 ? <div className="text-xs text-muted-foreground">No groups</div> :
                  allGroups.map(([id, name]) => (
                    <div key={id} className="flex items-center gap-2 py-1">
                      <Checkbox id={`g-${id}`} checked={groupFilter.has(id)} onCheckedChange={(v) => {
                        setGroupFilter((s) => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n; });
                      }} />
                      <Label htmlFor={`g-${id}`} className="text-sm cursor-pointer">{name}</Label>
                    </div>
                  ))
                }
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Roles</div>
                {allRoles.length === 0 ? <div className="text-xs text-muted-foreground">No titles</div> :
                  allRoles.map((r) => (
                    <div key={r} className="flex items-center gap-2 py-1">
                      <Checkbox id={`r-${r}`} checked={roleFilter.has(r)} onCheckedChange={(v) => {
                        setRoleFilter((s) => { const n = new Set(s); v ? n.add(r) : n.delete(r); return n; });
                      }} />
                      <Label htmlFor={`r-${r}`} className="text-sm cursor-pointer">{r}</Label>
                    </div>
                  ))
                }
              </div>
              {activeFilters > 0 && (
                <Button size="sm" variant="ghost" onClick={() => { setGroupFilter(new Set()); setRoleFilter(new Set()); }}>Clear all</Button>
              )}
            </PopoverContent>
          </Popover>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
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
              <ResizableHead width={cols.widths[0]} onResize={cols.onMouseDown(0)}>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 font-semibold">
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>
                <button onClick={() => toggleSort("completion")} className="flex items-center gap-1 font-semibold">
                  Completion score <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>%</ResizableHead>
              <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>
                <button onClick={() => toggleSort("last_login")} className="flex items-center gap-1 font-semibold">
                  Last login <ArrowUpDown className="h-3 w-3" />
                </button>
              </ResizableHead>
              <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>Groups</ResizableHead>
              <ResizableHead width={cols.widths[5]} className="text-right">Actions</ResizableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No people found.</TableCell></TableRow>
            ) : (
              pageRows.map((r: PersonRow) => {
                const fullName = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || r.email;
                return (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9">
                          {r.profile_image_url ? <AvatarImage src={r.profile_image_url} alt={fullName} /> : null}
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold truncate uppercase text-sm">{fullName}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.job_title ?? r.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><CompletionBar pct={r.avg_pct} showLabel={false} /></TableCell>
                    <TableCell className="font-medium tabular-nums">{r.avg_pct}%</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(r.last_login)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.groups.slice(0, 1).map((g) => (
                          <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                        ))}
                        {r.groups.length > 1 && <Badge variant="outline" className="text-xs">+{r.groups.length - 1}</Badge>}
                        {r.groups.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" size="sm" className="text-primary"
                        onClick={() => setDetailsUser({ id: r.user_id, name: fullName })}>
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
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

      <UserRequiredSubjectsDialog
        open={!!detailsUser}
        onOpenChange={(o) => !o && setDetailsUser(null)}
        userId={detailsUser?.id ?? null}
        userName={detailsUser?.name ?? ""}
      />
    </ReportsShell>
  );
};

export default AdminWikiReportsPeople;
