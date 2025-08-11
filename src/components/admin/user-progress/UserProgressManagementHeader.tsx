
import { Button } from "@/components/ui/button";
import { FileDown, Download, ShieldCheck, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompletionMonitoring } from "@/hooks/useCompletionMonitoring";
import { useProgressBackfill } from "@/hooks/useProgressBackfill";
import { useState } from "react";

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

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Progress Tracking</h2>
        <p className="text-gray-600">Monitor user course and unit completion progress</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleValidate} disabled={!hasData || processing}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          Validate
        </Button>
        <Button variant="outline" onClick={handleBackfill} disabled={processing}>
          <Wrench className="h-4 w-4 mr-2" />
          Backfill
        </Button>
        <Button variant="outline" onClick={onExportCSV} disabled={!hasData}>
          <FileDown className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button variant="outline" onClick={onRefreshData} disabled={processing}>
          <Download className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default UserProgressManagementHeader;
