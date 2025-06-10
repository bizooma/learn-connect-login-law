
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeAdminMarkUnitComplete, validateAdminUnitCompletion } from "./services/safeAdminUnitOperations";

interface AdminUnitCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  unitId: string;
  courseId: string;
  unitTitle: string;
  userName: string;
  onSuccess?: () => void;
}

const AdminUnitCompletionDialog = ({
  open,
  onOpenChange,
  userId,
  unitId,
  courseId,
  unitTitle,
  userName,
  onSuccess
}: AdminUnitCompletionDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleValidate = async () => {
    if (!userId || !unitId || !courseId) return;

    setLoading(true);
    try {
      const result = await validateAdminUnitCompletion(userId, unitId, courseId);
      setValidationResult(result);
      
      if (!result.isValid) {
        toast({
          title: "Validation Failed",
          description: result.issues.join(", "),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate unit completion request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for marking this unit as complete",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await safeAdminMarkUnitComplete(userId, unitId, courseId, reason);
      
      if (result.success) {
        toast({
          title: "✅ Unit Marked Complete",
          description: `Successfully marked "${unitTitle}" as complete for ${userName}. Course progress updated.`,
        });
        
        // Trigger parent refresh to show updated progress
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
        setReason("");
        setValidationResult(null);
      } else {
        toast({
          title: "🚨 Operation Failed",
          description: result.errors.join(", "),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Admin unit completion error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark unit as complete",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-validate when dialog opens
  useEffect(() => {
    if (open && userId && unitId && courseId) {
      handleValidate();
    }
  }, [open, userId, unitId, courseId]);

  const canProceed = validationResult?.isValid && reason.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Admin Unit Completion Override
          </DialogTitle>
          <DialogDescription>
            Mark a unit as completed for a user. This will bypass the normal completion requirements and update course progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Override Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>User:</strong> {userName}</p>
              <p><strong>Unit:</strong> {unitTitle}</p>
              <p><strong>Action:</strong> Mark as completed via admin override</p>
            </div>
          </div>

          {validationResult && (
            <div className="space-y-2">
              {validationResult.isValid ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Validation passed</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Validation failed</span>
                  </div>
                  {validationResult.issues.map((issue: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {issue}
                    </Badge>
                  ))}
                </div>
              )}
              
              {validationResult.warnings.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm text-orange-600">Warnings:</span>
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs text-orange-600 border-orange-200">
                      {warning}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Override *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this unit should be marked as complete (e.g., completed offline, technical issue, make-up work, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-xs text-orange-700">
              <strong>Warning:</strong> This action will mark the unit as completed and update course completion status. 
              This action is logged for audit purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canProceed || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Processing..." : "Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUnitCompletionDialog;
