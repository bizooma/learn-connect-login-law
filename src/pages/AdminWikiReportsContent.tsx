import { useMemo, useState } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { useContentReport } from "@/hooks/useWikiReports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";


const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const AdminWikiReportsContent = () => {
  const { data = [], isLoading } = useContentReport();
  const [search, setSearch] = useState("");
  const cols = useResizableColumns({
    storageKey: "report-content-cols",
    defaults: [320, 240, 240, 100, 160, 120],
  });


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? data.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            (r.category_title ?? "").toLowerCase().includes(q)
        )
      : data;
    return [...base].sort((a, b) => b.unique_readers - a.unique_readers);
  }, [data, search]);

  const exportCsv = () => {
    const headers = ["Title", "Category", "Published", "Unique Readers", "Total Views", "Read %", "Last Updated"];
    const rows = filtered.map((r) => [
      r.title,
      r.category_title ?? "",
      r.is_published ? "Yes" : "No",
      r.unique_readers,
      r.total_views,
      `${r.read_pct}%`,
      formatDate(r.updated_at),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ReportsShell
      title="Content Report"
      subtitle="Sort, filter and view how staff are engaging with Policies & Procedures."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles or category..."
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
              <ResizableHead width={cols.widths[0]} onResize={cols.onMouseDown(0)}>Name</ResizableHead>
              <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>Category</ResizableHead>
              <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>Read by staff</ResizableHead>
              <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>Views</ResizableHead>
              <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>Last updated</ResizableHead>
              <ResizableHead width={cols.widths[5]}>Status</ResizableHead>

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
                  No articles found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.article_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{row.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.category_title ?? "—"}
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
                      {row.unique_readers} {row.unique_readers === 1 ? "reader" : "readers"}
                    </div>
                  </TableCell>
                  <TableCell>{row.total_views}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.updated_at)}
                  </TableCell>
                  <TableCell>
                    {row.is_published ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
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

export default AdminWikiReportsContent;
