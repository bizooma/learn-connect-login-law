import { useMemo, useState } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { usePeopleReport } from "@/hooks/useWikiReports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? data.filter((r) => {
          const name = `${r.first_name ?? ""} ${r.last_name ?? ""}`.toLowerCase();
          return (
            name.includes(q) ||
            r.email.toLowerCase().includes(q) ||
            (r.job_title ?? "").toLowerCase().includes(q)
          );
        })
      : data;
    return [...base].sort((a, b) => b.articles_read - a.articles_read);
  }, [data, search]);

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead className="w-[240px]">Completion</TableHead>
              <TableHead className="w-[100px]">Views</TableHead>
              <TableHead className="w-[200px]">Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No people found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.job_title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${row.read_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {row.read_pct}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {row.articles_read} {row.articles_read === 1 ? "article" : "articles"} read
                    </div>
                  </TableCell>
                  <TableCell>{row.total_views}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.last_activity)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </ReportsShell>
  );
};

export default AdminWikiReportsPeople;
