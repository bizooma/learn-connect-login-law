
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calculator, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BulkRecalculationResult {
  success: boolean;
  courses_updated: number;
  users_affected: number;
  details: {
    affected_users: string[];
    affected_courses: string[];
    errors: string[];
    audit_id: string;
  };
}

const BulkProgressRecalculation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reason, setReason] = useState("Bulk recalculation to fix historical progress inconsistencies");
  const [lastResult, setLastResult] = useState<BulkRecalculationResult | null>(null);
  const { toast } = useToast();

  const handleStartRecalculation = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the bulk recalculation",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🔄 Starting bulk progress recalculation...');
      
      const { data, error } = await supabase.rpc('admin_recalculate_all_progress', {
        p_reason: reason
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Bulk recalculation completed:', data);
      setLastResult(data);
      
      toast({
        title: "✅ Bulk Recalculation Complete",
        description: `Updated ${data.courses_updated} course records for ${data.users_affected} users`,
      });

      setShowConfirmDialog(false);
      
    } catch (error: any) {
      console.error('❌ Bulk recalculation error:', error);
      toast({
        title: "🚨 Recalculation Failed",
        description: error.message || "Failed to perform bulk recalculation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bulk Progress Recalculation
          </CardTitle>
          <CardDescription>
            Fix historical progress inconsistencies where users have completed units but show 0% course progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This operation will recalculate course progress for users who have completed units but show incorrect progress percentages. 
              It will update course completion statuses and percentages based on actual unit completions.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">What it does:</h4>
              <ul className="mt-1 text-blue-700 text-xs space-y-1">
                <li>• Finds users with completed units but 0% progress</li>
                <li>• Recalculates correct progress percentages</li>
                <li>• Updates course completion status</li>
                <li>• Creates audit trail for all changes</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Safety measures:</h4>
              <ul className="mt-1 text-green-700 text-xs space-y-1">
                <li>• Backs up original data before changes</li>
                <li>• Only updates inconsistent records</li>
                <li>• Comprehensive error handling</li>
                <li>• Admin-only operation</li>
              </ul>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">Expected results:</h4>
              <ul className="mt-1 text-orange-700 text-xs space-y-1">
                <li>• Correct progress bars for users</li>
                <li>• Proper course completion status</li>
                <li>• Certificate generation eligibility</li>
                <li>• Accurate admin dashboards</li>
              </ul>
            </div>
          </div>

          {lastResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Last recalculation results:</strong>
                <br />
                • Updated {lastResult.courses_updated} course records
                <br />
                • Affected {lastResult.users_affected} users
                <br />
                {lastResult.details.errors.length > 0 && (
                  <>• {lastResult.details.errors.length} errors occurred</>
                )}
                <br />
                • Audit ID: {lastResult.details.audit_id}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Bulk Recalculation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Bulk Progress Recalculation
            </DialogTitle>
            <DialogDescription>
              This operation will recalculate course progress for all users with inconsistent data. 
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded">
              <h4 className="font-medium text-orange-900 mb-2">Operation Summary:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Find users with completed units but 0% course progress</li>
                <li>• Recalculate correct progress percentages and statuses</li>
                <li>• Update course completion data in the database</li>
                <li>• Create audit logs for all changes made</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recalc-reason">Reason for Recalculation *</Label>
              <Textarea
                id="recalc-reason"
                placeholder="Explain why this bulk recalculation is being performed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This operation is irreversible and will affect multiple user accounts. 
                Ensure you have reviewed the need for this recalculation.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartRecalculation}
              disabled={!reason.trim() || isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Recalculation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkProgressRecalculation;
