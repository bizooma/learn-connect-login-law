import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const MaintenanceLog = ({ recent = [] }: MaintenanceLogProps) => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_management_history' as any, {
        p_user_id: null,
        p_limit: 50
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
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No maintenance actions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-md p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{r.action_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.performed_at).toLocaleString()} • {r.performer_email || 'System'}
                  </div>
                  {r.target_email && (
                    <div className="text-xs text-muted-foreground">Target: {r.target_email}</div>
                  )}
                  {r.reason && (
                    <div className="text-xs text-muted-foreground">Reason: {r.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceLog;
