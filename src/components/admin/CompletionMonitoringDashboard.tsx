import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDataProtection } from "@/hooks/useDataProtection";
import { useCompletionMonitoring } from "@/hooks/useCompletionMonitoring";
import { Activity, RefreshCw, CheckCircle, AlertTriangle, Database, TrendingUp, Users, BookOpen, Play, Square } from "lucide-react";
import ProgressBackfillTool from "./ProgressBackfillTool";
import VideoCompletionManager from "./VideoCompletionManager";
import { logger } from "@/utils/logger";

interface DiagnosticResults {
  total_users_with_progress: number;
  users_with_zero_progress: number;
  users_with_completed_units_but_zero_progress: number;
  sample_inconsistent_records: any;
}

interface CompletionStats {
  totalIncompleteUnits: number;
  videoCompletionIssues: number;
  courseProgressInconsistencies: number;
  affectedUsers: number;
}

const CompletionMonitoringDashboard = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResults | null>(null);
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [lastRepairRun, setLastRepairRun] = useState<string | null>(null);
  const { toast } = useToast();
  const { validateAllDataIntegrity } = useDataProtection();
  const { 
    issues, 
    isMonitoring, 
    lastCheck, 
    startMonitoring, 
    stopMonitoring, 
    manualScan,
    getIssueSummary 
  } = useCompletionMonitoring(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoadingDiagnostics(true);
    try {
      await Promise.all([
        runProgressDiagnostics(),
        loadCompletionStats()
      ]);
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  const runProgressDiagnostics = async () => {
    try {
      const { data, error } = await supabase.rpc('diagnose_progress_inconsistencies');
      
      if (error) {
        toast({
          title: "Diagnostic Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setDiagnosticResults(data[0]);
    } catch (error) {
      logger.error('Error running diagnostics:', error);
    }
  };

  const loadCompletionStats = async () => {
    try {
      // Get incomplete units with completed quizzes
      const { data: incompleteUnits } = await supabase
        .from('user_unit_progress')
        .select('user_id', { count: 'exact' })
        .eq('quiz_completed', true)
        .eq('completed', false);

      // Get video completion issues
      const { data: videoIssues } = await supabase
        .from('user_video_progress')
        .select('user_id', { count: 'exact' })
        .gte('watch_percentage', 95)
        .eq('is_completed', false);

      // Get course progress inconsistencies
      const { data: courseInconsistencies } = await supabase
        .from('user_course_progress')
        .select('user_id', { count: 'exact' })
        .eq('progress_percentage', 0)
        .in('status', ['in_progress', 'completed']);

      setCompletionStats({
        totalIncompleteUnits: incompleteUnits?.length || 0,
        videoCompletionIssues: videoIssues?.length || 0,
        courseProgressInconsistencies: courseInconsistencies?.length || 0,
        affectedUsers: new Set([
          ...(incompleteUnits?.map(u => u.user_id) || []),
          ...(videoIssues?.map(u => u.user_id) || []),
          ...(courseInconsistencies?.map(u => u.user_id) || [])
        ]).size
      });
    } catch (error) {
      logger.error('Error loading completion stats:', error);
    }
  };

  const runBulkProgressRecalculation = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_recalculate_all_progress', {
        p_reason: 'Completion monitoring dashboard bulk recalculation'
      });

      if (error) {
        toast({
          title: "Recalculation Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result = data as any;
      toast({
        title: "Progress Recalculation Complete! ✅",
        description: `Updated ${result.courses_updated || 0} courses affecting ${result.users_affected || 0} users.`,
      });

      setLastRepairRun(new Date().toISOString());
      loadDashboardData(); // Refresh data
    } catch (error) {
      logger.error('Error running bulk recalculation:', error);
      toast({
        title: "Recalculation Error",
        description: "Failed to run bulk progress recalculation.",
        variant: "destructive",
      });
    }
  };

  const runDataIntegrityCheck = async () => {
    try {
      const result = await validateAllDataIntegrity();
      
      toast({
        title: result.isValid ? "Data Integrity Check Passed ✅" : "Data Integrity Issues Found ⚠️",
        description: `Found ${result.summary.totalIssues} critical issues and ${result.summary.totalWarnings} warnings.`,
        variant: result.isValid ? "default" : "destructive",
      });

      if (!result.isValid) {
        logger.log('Data integrity issues:', result);
      }
    } catch (error) {
      logger.error('Error running data integrity check:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completion Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Monitor and repair user progress completion issues</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadDashboardData} disabled={isLoadingDiagnostics} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingDiagnostics ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={runDataIntegrityCheck} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Integrity Check
          </Button>
          <Button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring} 
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Monitor
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitor
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Real-time Monitoring Status */}
      {isMonitoring && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>🟢 Real-time monitoring active</span>
              <div className="text-sm text-muted-foreground">
                Last check: {lastCheck ? lastCheck.toLocaleTimeString() : 'Never'} | 
                Issues found: {getIssueSummary().total} | 
                Affected users: {getIssueSummary().affectedUsers}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Units</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.totalIncompleteUnits || 0}</div>
            <p className="text-xs text-muted-foreground">Quiz done, unit pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Issues</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.videoCompletionIssues || 0}</div>
            <p className="text-xs text-muted-foreground">Watched but not marked complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress Issues</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.courseProgressInconsistencies || 0}</div>
            <p className="text-xs text-muted-foreground">Progress calculation errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionStats?.affectedUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Users with completion issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic Results */}
      {diagnosticResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>System Diagnostics</span>
              <Badge variant={diagnosticResults.users_with_completed_units_but_zero_progress > 0 ? "destructive" : "default"}>
                {diagnosticResults.users_with_completed_units_but_zero_progress > 0 ? "Issues Found" : "Healthy"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-semibold">{diagnosticResults.total_users_with_progress}</div>
                <div className="text-sm text-muted-foreground">Total Users with Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">{diagnosticResults.users_with_zero_progress}</div>
                <div className="text-sm text-muted-foreground">Users with Zero Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-red-600">{diagnosticResults.users_with_completed_units_but_zero_progress}</div>
                <div className="text-sm text-muted-foreground">Inconsistent Progress Records</div>
              </div>
            </div>

            {diagnosticResults.sample_inconsistent_records && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Sample Inconsistent Records:</h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(diagnosticResults.sample_inconsistent_records, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Repair Tools */}
      <Tabs defaultValue="backfill" className="w-full">
        <TabsList>
          <TabsTrigger value="backfill">Progress Backfill</TabsTrigger>
          <TabsTrigger value="video">Video Completion</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="backfill" className="space-y-4">
          <ProgressBackfillTool />
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <VideoCompletionManager />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Bulk Operations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These operations affect all users and should be used carefully. 
                  Run after individual repairs to recalculate overall progress.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Button 
                  onClick={runBulkProgressRecalculation}
                  className="w-full"
                  size="lg"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Bulk Progress Recalculation
                </Button>

                {lastRepairRun && (
                  <div className="text-sm text-muted-foreground">
                    Last repair run: {new Date(lastRepairRun).toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompletionMonitoringDashboard;