
import { Button } from "@/components/ui/button";
import { FileDown, Download, ShieldCheck, Wrench, BarChart3, RefreshCw, Hammer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompletionMonitoring } from "@/hooks/useCompletionMonitoring";
import { useProgressBackfill } from "@/hooks/useProgressBackfill";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserProgressManagementHeaderProps {
  onExportCSV: () => void;
  onRefreshData: () => void;
  hasData: boolean;
}

const UserProgressManagementHeader = ({
  onExportCSV,
  onRefreshData,
  hasData
}: UserProgressManagementHeaderProps) => {
  const { toast } = useToast();
  const { manualScan, getIssueSummary } = useCompletionMonitoring(false);
  const { backfillMissingUnitCompletions, fixVideoCompletionIssues } = useProgressBackfill();
  const [processing, setProcessing] = useState(false);
  const [confirmFixOpen, setConfirmFixOpen] = useState(false);
  const [confirmRecalcOpen, setConfirmRecalcOpen] = useState(false);

  const handleValidate = async () => {
    try {
      setProcessing(true);
      await manualScan();
      const summary = getIssueSummary();
      toast({
        title: "Validation complete",
        description: `High: ${summary.high}, Medium: ${summary.medium}, Low: ${summary.low}`,
      });
    } catch (e) {
      toast({ title: "Validation failed", description: "Could not complete validation", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleBackfill = async () => {
    try {
      setProcessing(true);
      await fixVideoCompletionIssues();
      await backfillMissingUnitCompletions();
      toast({ title: "Backfill complete", description: "Video flags and unit completions repaired" });
      onRefreshData();
    } catch (e) {
      toast({ title: "Backfill failed", description: "An error occurred while repairing data", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };
  const handleAnalyzeMissing = async () => {
    try {
      setProcessing(true);
      const { data, error } = await supabase.rpc('analyze_missing_quiz_completions' as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      toast({
        title: "Analyze complete",
        description: `Missing: ${row?.missing_completion_records || 0}, Affected users: ${row?.affected_users || 0}, Courses: ${row?.affected_courses || 0}`,
      });
    } catch (e) {
      toast({ title: "Analyze failed", description: "Could not analyze missing quiz completions", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleFixMissing = async () => {
    try {
      setProcessing(true);
      const { data, error } = await supabase.rpc('fix_missing_quiz_completions' as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      toast({
        title: "Fix complete",
        description: `Records created: ${row?.records_created || 0}, Users affected: ${row?.users_affected || 0}, Courses updated: ${row?.courses_updated || 0}`,
      });
      onRefreshData();
    } catch (e) {
      toast({ title: "Fix failed", description: "An error occurred while fixing missing completions", variant: "destructive" });
    } finally {
      setProcessing(false);
      setConfirmFixOpen(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setProcessing(true);
      const { data, error } = await supabase.rpc('bulk_recalculate_course_progress' as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      toast({
        title: "Recalculation complete",
        description: `Courses updated: ${row?.courses_updated || 0}, Users affected: ${row?.users_affected || 0}`,
      });
      onRefreshData();
    } catch (e) {
      toast({ title: "Recalculation failed", description: "Could not recalculate course progress", variant: "destructive" });
    } finally {
      setProcessing(false);
      setConfirmRecalcOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Progress Tracking</h2>
        <p className="text-gray-600">Monitor user course and unit completion progress</p>
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={handleValidate} disabled={!hasData || processing}>
          <ShieldCheck className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
          {processing ? 'Validating...' : 'Validate'}
        </Button>
        <Button variant="outline" onClick={handleBackfill} disabled={processing}>
          <Wrench className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
          {processing ? 'Backfilling...' : 'Backfill'}
        </Button>
        <Button variant="outline" onClick={handleAnalyzeMissing} disabled={processing}>
          <BarChart3 className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
          Analyze
        </Button>
        <Button variant="outline" onClick={() => setConfirmFixOpen(true)} disabled={processing}>
          <Hammer className="h-4 w-4 mr-2" />
          Fix Missing
        </Button>
        <Button variant="outline" onClick={() => setConfirmRecalcOpen(true)} disabled={processing}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
        <Button variant="outline" onClick={onExportCSV} disabled={!hasData}>
          <FileDown className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button variant="outline" onClick={onRefreshData} disabled={processing}>
          <Download className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>

        {/* Confirm Fix Missing */}
        <AlertDialog open={confirmFixOpen} onOpenChange={setConfirmFixOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fix missing quiz completions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create missing quiz completion and unit progress records based on the activity log. The operation is additive and audited.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFixMissing} disabled={processing}>
                {processing ? 'Fixing…' : 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm Recalculate */}
        <AlertDialog open={confirmRecalcOpen} onOpenChange={setConfirmRecalcOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Recalculate course progress?</AlertDialogTitle>
              <AlertDialogDescription>
                This runs a safe, no-downgrade recalculation across affected enrollments. Existing higher progress is preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRecalculate} disabled={processing}>
                {processing ? 'Recalculating…' : 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default UserProgressManagementHeader;
