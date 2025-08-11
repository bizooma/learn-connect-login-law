import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Cpu, Gauge, ShieldCheck, Wifi } from "lucide-react";
import { useSystemHealthMonitor } from "@/hooks/useSystemHealthMonitor";
import { runProductionHealthCheck } from "@/utils/productionReadiness";

// Lightweight health cards for admins (read-only)
// Uses existing monitoring hook + production health check util
export default function HealthCheckCards() {
  const { metrics, getHealthStatus } = useSystemHealthMonitor();
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [prodHealth, setProdHealth] = useState<ReturnType<typeof runProductionHealthCheck> | null>(null);

  const overallStatus = useMemo(() => getHealthStatus?.().status ?? "healthy", [getHealthStatus]);

  const runCheck = () => {
    setRunning(true);
    const h = runProductionHealthCheck();
    setProdHealth(h);
    setLastRun(new Date().toLocaleTimeString());
    setRunning(false);
  };

  useEffect(() => {
    // Initial check on mount
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pill = (status?: string) => {
    const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    const map: Record<string, string> = {
      healthy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return `${base} ${map[status || "healthy"] || map.healthy}`;
  };

  return (
    <section aria-labelledby="system-health-heading" className="mt-8">
      <header className="mb-3 flex items-center justify-between">
        <h2 id="system-health-heading" className="text-base font-semibold tracking-tight">
          System health
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{lastRun ? `Last check: ${lastRun}` : ""}</span>
          <Button size="sm" variant="outline" onClick={runCheck} disabled={running} aria-label="Run health check">
            {running ? "Checking…" : "Run check"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize flex items-center gap-2">
              <span className={pill(prodHealth?.overall || overallStatus)}>
                {prodHealth?.overall || overallStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Aggregated from runtime + page load</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{prodHealth?.checks.memory.usage || metrics.memoryUsage || "–"}</div>
            <p className="text-xs mt-1">
              <span className={pill(prodHealth?.checks.memory.status)}>{prodHealth?.checks.memory.status || "healthy"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">{prodHealth?.checks.memory.details || "Runtime heap usage"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{metrics.errorCount ?? 0}</div>
            <p className="text-xs mt-1">
              <span className={pill(prodHealth?.checks.errors.status)}>{prodHealth?.checks.errors.status || "healthy"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">{metrics.lastError ? String(metrics.lastError) : "No recent errors"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{prodHealth?.checks.performance.loadTime || "–"}</div>
            <p className="text-xs mt-1">
              <span className={pill(prodHealth?.checks.performance.status)}>{prodHealth?.checks.performance.status || "healthy"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">{prodHealth?.checks.performance.details || "Page load"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connectivity</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">{prodHealth?.checks.connectivity.connection || (metrics.connectionStatus === 'connected' ? "online" : "offline")}</div>
            <p className="text-xs mt-1">
              <span className={pill(prodHealth?.checks.connectivity.status)}>{prodHealth?.checks.connectivity.status || (metrics.connectionStatus === 'connected' ? "healthy" : "critical")}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">Network status</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
