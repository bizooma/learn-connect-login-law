
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calculator, CheckCircle, Clock, RefreshCw, Search } from "lucide-react";
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

// Type for the Supabase RPC response
interface SupabaseBulkRecalculationResponse {
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

// Type for diagnostic results
interface DiagnosticResult {
  total_users_with_progress: number;
  users_with_zero_progress: number;
  users_with_completed_units_but_zero_progress: number;
  sample_inconsistent_records: any[];
}

const BulkProgressRecalculation = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reason, setReason] = useState("Bulk recalculation to fix historical progress inconsistencies");
  const [lastResult, setLastResult] = useState<BulkRecalculationResult | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const { toast } = useToast();

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      console.log('🔍 Running progress data diagnostic...');
      
      const { data, error } = await supabase.rpc('diagnose_progress_inconsistencies');

      if (error) {
        throw new Error(error.message);
      }

      console.log('📊 Diagnostic results:', data);
      setDiagnosticResult(data[0]); // RPC returns array, take first result
      
      toast({
        title: "🔍 Diagnostic Complete",
        description: `Found ${data[0]?.users_with_completed_units_but_zero_progress || 0} users with progress inconsistencies`,
      });
      
    } catch (error: any) {
      console.error('❌ Diagnostic error:', error);
      toast({
        title: "🚨 Diagnostic Failed",
        description: error.message || "Failed to run diagnostic",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

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
      
      // Properly type cast the response
      const typedData = data as unknown as SupabaseBulkRecalculationResponse;
      setLastResult({
        success: typedData.success,
        courses_updated: typedData.courses_updated,
        users_affected: typedData.users_affected,
        details: typedData.details
      });
      
      toast({
        title: "✅ Bulk Recalculation Complete",
        description: `Updated ${typedData.courses_updated} course records for ${typedData.users_affected} users`,
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
      {/* Diagnostic Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Progress Data Diagnostic
          </CardTitle>
          <CardDescription>
            Analyze your data to understand progress inconsistencies before running bulk recalculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Run a diagnostic to see how many users have progress inconsistencies that need fixing.
            </p>
            <Button
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              variant="outline"
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              {isRunningDiagnostic ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Diagnostic
                </>
              )}
            </Button>
          </div>

          {diagnosticResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900">Total Users</h4>
                <p className="text-2xl font-bold text-blue-700">
                  {diagnosticResult.total_users_with_progress}
                </p>
                <p className="text-xs text-blue-600">with course progress</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900">Zero Progress</h4>
                <p className="text-2xl font-bold text-orange-700">
                  {diagnosticResult.users_with_zero_progress}
                </p>
                <p className="text-xs text-orange-600">users with 0% progress</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900">Inconsistent</h4>
                <p className="text-2xl font-bold text-red-700">
                  {diagnosticResult.users_with_completed_units_but_zero_progress}
                </p>
                <p className="text-xs text-red-600">completed units but 0% progress</p>
              </div>
            </div>
          )}

          {diagnosticResult?.sample_inconsistent_records && diagnosticResult.sample_inconsistent_records.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Sample Inconsistent Records:</h4>
              <div className="bg-gray-50 p-3 rounded border text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(diagnosticResult.sample_inconsistent_records, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Recalculation Section */}
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
