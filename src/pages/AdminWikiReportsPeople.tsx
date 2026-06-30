import { useEffect, useMemo, useState } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { usePeopleReport } from "@/hooks/useWikiReports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";

import { useOrgPeopleSettings } from "@/hooks/useOrgPeopleSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import UserSubjectProgressDialog from "@/components/admin/wiki/reports/UserSubjectProgressDialog";



const formatDate = (iso: string | null) => {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const AdminWikiReportsPeople = () => {
  const { data = [], isLoading } = usePeopleReport();
  const { settings } = useOrgPeopleSettings();
  const { isAdmin } = useUserRole();
  const [search, setSearch] = useState("");
  const [directReportIds, setDirectReportIds] = useState<string[] | null>(null);
  const [detailsUser, setDetailsUser] = useState<{ id: string; name: string } | null>(null);
  const cols = useResizableColumns({
    storageKey: "report-people-cols",
    defaults: [280, 200, 260, 100, 200, 140],
  });



  // If sharing with direct reports is on and viewer isn't admin, fetch their direct reports.
  useEffect(() => {
    let active = true;
    (async () => {
      if (isAdmin || !settings.shareReportsWithDirectReports) {
        setDirectReportIds(null);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (active) setDirectReportIds([]);
        return;
      }
      const { data: reports } = await supabase
        .from("profiles")
        .select("id")
        .eq("manager_id", uid);
      if (active) setDirectReportIds((reports ?? []).map((r: any) => r.id));
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, settings.shareReportsWithDirectReports]);

  const scoped = useMemo(() => {
    if (directReportIds === null) return data; // unrestricted view
    const allow = new Set(directReportIds);
    return data.filter((r) => allow.has(r.user_id));
  }, [data, directReportIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? scoped.filter((r) => {

          const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.toLowerCase();
          return (
            name.includes(q) ||
            r.email.toLowerCase().includes(q) ||
            (r.job_title ?? "").toLowerCase().includes(q)
          );
        })
      : scoped;
    return [...base].sort((a, b) => b.articles_read - a.articles_read);
  }, [scoped, search]);


  const exportCsv = () => {
    const headers = ["Name", "Email", "Job Title", "Articles Read", "Total Views", "Read %", "Last Activity"];
    const rows = filtered.map((r) => [
      `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      r.email,
      r.job_title ?? "",
      r.articles_read,
      r.total_views,
      `${r.read_pct}%`,
      formatDate(r.last_activity),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `people-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ReportsShell
      title="People Report"
      subtitle="See how each person is keeping up with Policies & Procedures."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="pl-9"
          />
        </div>
        <Button onClick={exportCsv} className="gap-2" disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Download .csv
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <ResizableHead width={cols.widths[0]} onResize={cols.onMouseDown(0)}>Person</ResizableHead>
              <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>Job title</ResizableHead>
              <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>Completion</ResizableHead>
              <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>Views</ResizableHead>
              <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>Last activity</ResizableHead>
              <ResizableHead width={cols.widths[5]} className="text-right">Actions</ResizableHead>

            </TableRow>

          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No people found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email;
                return (
                  <TableRow key={row.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{fullName}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.job_title ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${row.read_pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{row.read_pct}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {row.articles_read} {row.articles_read === 1 ? "article" : "articles"} read
                      </div>
                    </TableCell>
                    <TableCell>{row.total_views}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(row.last_activity)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary"
                        onClick={() => setDetailsUser({ id: row.user_id, name: fullName })}
                      >
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <UserSubjectProgressDialog
        open={!!detailsUser}
        onOpenChange={(o) => !o && setDetailsUser(null)}
        userId={detailsUser?.id ?? null}
        userName={detailsUser?.name ?? ""}
      />
    </ReportsShell>

  );
};

export default AdminWikiReportsPeople;
