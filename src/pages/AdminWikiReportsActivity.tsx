import { useMemo, useState } from "react";
import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import { useActivityReport } from "@/hooks/useWikiReports";
import { Input } from "@/components/ui/input";
import { Search, FileText, User } from "lucide-react";

const formatRelative = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
};

const AdminWikiReportsActivity = () => {
  const { data = [], isLoading } = useActivityReport(200);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.user_name.toLowerCase().includes(q) ||
        r.user_email.toLowerCase().includes(q) ||
        r.article_title.toLowerCase().includes(q) ||
        (r.category_title ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <ReportsShell
      title="Latest Activity"
      subtitle="Recent reads across Policies & Procedures."
    >
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity..."
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No activity yet. Reads will appear here as staff open articles.
          </div>
        ) : (
          filtered.map((row) => (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{row.user_name}</span>
                  <span className="text-muted-foreground"> read </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {row.article_title}
                  </span>
                  {row.category_title && (
                    <span className="text-muted-foreground"> in {row.category_title}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{row.user_email}</div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {formatRelative(row.viewed_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </ReportsShell>
  );
};

export default AdminWikiReportsActivity;
