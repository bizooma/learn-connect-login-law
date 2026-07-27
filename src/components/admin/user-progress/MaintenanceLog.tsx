import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AuditRow {
  id: string;
  target_user_id: string | null;
  target_email: string | null;
  action_type: string;
  performed_by: string | null;
  performer_email: string | null;
  performed_at: string;
  reason: string | null;
}

interface RecentSummary { id: string; type: string; payload: any; ok: boolean; at: string; }

type MaintenanceLogProps = { recent?: RecentSummary[] };

interface Grouped {
  key: string;
  action_type: string;
  target_email: string | null;
  performer_email: string | null;
  reason: string | null;
  firstAt: string;
  lastAt: string;
  rows: AuditRow[];
}

// Group entries with same performer+target+action+reason within a 5-minute window
const GROUP_WINDOW_MS = 5 * 60 * 1000;

const groupRows = (rows: AuditRow[]): Grouped[] => {
  const groups: Grouped[] = [];
  for (const r of rows) {
    const ts = new Date(r.performed_at).getTime();
    const existing = groups.find(g =>
      g.action_type === r.action_type &&
      g.target_email === r.target_email &&
      g.performer_email === r.performer_email &&
      (g.reason || '') === (r.reason || '') &&
      Math.abs(new Date(g.firstAt).getTime() - ts) <= GROUP_WINDOW_MS
    );
    if (existing) {
      existing.rows.push(r);
      if (ts < new Date(existing.firstAt).getTime()) existing.firstAt = r.performed_at;
      if (ts > new Date(existing.lastAt).getTime()) existing.lastAt = r.performed_at;
    } else {
      groups.push({
        key: r.id,
        action_type: r.action_type,
        target_email: r.target_email,
        performer_email: r.performer_email,
        reason: r.reason,
        firstAt: r.performed_at,
        lastAt: r.performed_at,
        rows: [r],
      });
    }
  }
  return groups.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
};

const MaintenanceLog = ({ recent = [] }: MaintenanceLogProps) => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_management_history' as any, {
        p_user_id: null,
        p_limit: 200
      });
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e) {
      console.error('Failed to fetch maintenance logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const grouped = useMemo(() => groupRows(rows), [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance Log</CardTitle>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {recent && recent.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium">Latest operation results</div>
            <div className="space-y-1 mt-1">
              {recent.map((r) => (
                <div key={r.id} className="text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleString()} • {r.type} • {r.ok ? 'ok' : 'failed'} • {JSON.stringify(r.payload).slice(0, 200)}
                </div>
              ))}
            </div>
          </div>
        )}
        {grouped.length === 0 ? (
          <div className="text-sm text-muted-foreground">No maintenance actions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => {
              const isOpen = !!expanded[g.key];
              const count = g.rows.length;
              return (
                <div key={g.key} className="border rounded-md p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{g.action_type}</div>
                        {count > 1 && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {count} entries
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(g.lastAt).toLocaleString()} • {g.performer_email || 'System'}
                      </div>
                      {g.target_email && (
                        <div className="text-xs text-muted-foreground">Target: {g.target_email}</div>
                      )}
                      {g.reason && (
                        <div className="text-xs text-muted-foreground">Reason: {g.reason}</div>
                      )}
                    </div>
                    {count > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(prev => ({ ...prev, [g.key]: !isOpen }))}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                        {isOpen ? 'Hide' : 'Show'} details
                      </Button>
                    )}
                  </div>
                  {isOpen && count > 1 && (
                    <div className="mt-3 pl-3 border-l space-y-1">
                      {g.rows.map(r => (
                        <div key={r.id} className="text-xs text-muted-foreground">
                          {new Date(r.performed_at).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceLog;
