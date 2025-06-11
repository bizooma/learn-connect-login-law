import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  safeRoleUpdate, 
  safeUserDeactivation, 
  safeUserRestoration,
  validateUserDataIntegrity 
} from "@/components/admin/user-management/services/safeUserOperations";
import { 
  safeBulkAssignCourse, 
  safeRemoveAssignments,
  validateAssignmentIntegrity 
} from "@/components/admin/assignment-management/services/safeAssignmentOperations";
import { 
  safeResetUserProgress, 
  safeBulkMarkCompleted,
  validateProgressIntegrity 
} from "@/components/admin/progress-management/services/safeProgressOperations";
import {
  safeAdminMarkUnitComplete,
  safeBulkAdminMarkUnitsComplete
} from "@/components/admin/progress-management/services/safeAdminUnitOperations";

export const useDataProtection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const showOperationResult = (result: any, operationType: string) => {
    if (result.success) {
      const successMessage = [
        `${operationType} completed successfully!`,
        result.backupId ? `Backup ID: ${result.backupId}` : '',
        `Processed: ${result.assignmentsProcessed || result.progressRecordsProcessed || result.completedUnits || 'N/A'}`,
        result.warnings.length > 0 ? `Warnings: ${result.warnings.length}` : ''
      ].filter(Boolean).join('\n');

      toast({
        title: "✅ Operation Successful",
        description: successMessage,
      });

      if (result.warnings.length > 0) {
        console.warn(`${operationType} warnings:`, result.warnings);
      }
    } else {
      const errorMessage = [
        `${operationType} failed:`,
        ...result.errors.slice(0, 3),
        result.errors.length > 3 ? `...and ${result.errors.length - 3} more errors` : ''
      ].filter(Boolean).join('\n');

      toast({
        title: "🚨 Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      console.error(`${operationType} errors:`, result.errors);
    }
  };

  // User operations
  const protectedRoleUpdate = async (userId: string, newRole: any, reason?: string) => {
    setIsProcessing(true);
    try {
      const result = await safeRoleUpdate(userId, newRole, reason);
      showOperationResult(result, 'Role Update');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedUserDeactivation = async (userId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const result = await safeUserDeactivation(userId, reason);
      showOperationResult(result, 'User Deactivation');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedUserRestoration = async (userId: string, reason: string) => {
    setIsProcessing(true);
    try {
      const result = await safeUserRestoration(userId, reason);
      showOperationResult(result, 'User Restoration');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  // Assignment operations
  const protectedBulkAssign = async (userIds: string[], courseId: string, assignedBy: string, options: any = {}) => {
    setIsProcessing(true);
    try {
      const result = await safeBulkAssignCourse(userIds, courseId, assignedBy, options);
      showOperationResult(result, 'Bulk Assignment');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedRemoveAssignments = async (assignmentIds: string[], reason?: string) => {
    setIsProcessing(true);
    try {
      const result = await safeRemoveAssignments(assignmentIds, reason);
      showOperationResult(result, 'Assignment Removal');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  // Progress operations
  const protectedProgressReset = async (userId: string, courseId?: string, reason?: string) => {
    setIsProcessing(true);
    try {
      const result = await safeResetUserProgress(userId, courseId, reason);
      showOperationResult(result, 'Progress Reset');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedBulkComplete = async (assignments: Array<{ userId: string; courseId: string }>, completionDate?: string) => {
    setIsProcessing(true);
    try {
      const result = await safeBulkMarkCompleted(assignments, completionDate);
      showOperationResult(result, 'Bulk Completion');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin unit completion operations
  const protectedAdminMarkUnitComplete = async (
    userId: string, 
    unitId: string, 
    courseId: string, 
    reason?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await safeAdminMarkUnitComplete(userId, unitId, courseId, reason);
      showOperationResult(result, 'Admin Unit Completion');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedBulkAdminMarkUnitsComplete = async (
    assignments: Array<{ userId: string; unitId: string; courseId: string }>,
    reason?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await safeBulkAdminMarkUnitsComplete(assignments, reason);
      showOperationResult(result, 'Bulk Admin Unit Completion');
      return result.success;
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced progress operations with refined recalculation
  const protectedProgressRecalculation = async (reason?: string) => {
    setIsProcessing(true);
    try {
      const { progressRecalculationService } = await import("@/components/admin/progress-management/services/progressRecalculationService");
      const result = await progressRecalculationService.recalculateProgressRefined(reason);
      
      if (result.success) {
        const successMessage = [
          `Progress recalculation completed successfully!`,
          `Records updated: ${result.recordsUpdated}`,
          `Users affected: ${result.usersAffected}`,
          result.details.preservedManualWork ? `✅ Manual work preserved` : '',
          result.errors.length > 0 ? `Warnings: ${result.errors.length}` : ''
        ].filter(Boolean).join('\n');

        toast({
          title: "✅ Recalculation Successful",
          description: successMessage,
        });

        if (result.errors.length > 0) {
          console.warn('Recalculation warnings:', result.errors);
        }
      } else {
        const errorMessage = [
          `Progress recalculation failed:`,
          ...result.errors.slice(0, 3),
          result.errors.length > 3 ? `...and ${result.errors.length - 3} more errors` : ''
        ].filter(Boolean).join('\n');

        toast({
          title: "🚨 Recalculation Failed",
          description: errorMessage,
          variant: "destructive",
        });

        console.error('Recalculation errors:', result.errors);
      }
      return result.success;
    } catch (error) {
      console.error('Error in progress recalculation:', error);
      toast({
        title: "🚨 Recalculation Error",
        description: `Failed to recalculate progress: ${error.message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const protectedProgressDiagnosis = async () => {
    setIsProcessing(true);
    try {
      const { progressRecalculationService } = await import("@/components/admin/progress-management/services/progressRecalculationService");
      const result = await progressRecalculationService.diagnoseInconsistencies();
      
      if (result.success) {
        const message = [
          `Progress integrity check completed`,
          `Total users: ${result.totalUsers}`,
          `Inconsistent records: ${result.inconsistentUsers}`,
          `Health score: ${result.healthScore.toFixed(1)}%`
        ].join('\n');

        toast({
          title: result.inconsistentUsers > 0 ? "⚠️ Issues Found" : "✅ System Healthy",
          description: message,
          variant: result.inconsistentUsers > 0 ? "destructive" : "default",
        });

        return result;
      } else {
        toast({
          title: "🚨 Diagnosis Failed",
          description: result.error,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Error in progress diagnosis:', error);
      toast({
        title: "🚨 Diagnosis Error",
        description: `Failed to diagnose progress: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced validation with progress integrity check
  const validateAllDataIntegrity = async (userId?: string) => {
    setIsProcessing(true);
    try {
      console.log('🔍 Running comprehensive data integrity check...');
      
      const [userResult, assignmentResult, progressResult, progressIntegrityResult] = await Promise.all([
        userId ? validateUserDataIntegrity(userId) : Promise.resolve({ isValid: true, issues: [], warnings: [], summary: {} }),
        validateAssignmentIntegrity(),
        validateProgressIntegrity(),
        (async () => {
          const { progressRecalculationService } = await import("@/components/admin/progress-management/services/progressRecalculationService");
          return await progressRecalculationService.getProgressIntegritySummary();
        })()
      ]);

      const totalIssues = userResult.issues.length + assignmentResult.issues.length + progressResult.issues.length;
      const totalWarnings = userResult.warnings.length + assignmentResult.warnings.length + progressResult.warnings.length;
      const progressInconsistencies = progressIntegrityResult.inconsistentRecords || 0;

      const summaryMessage = [
        `Data Integrity Check ${totalIssues === 0 && progressInconsistencies === 0 ? 'PASSED' : 'FAILED'}`,
        `Critical Issues: ${totalIssues}`,
        `Progress Inconsistencies: ${progressInconsistencies}`,
        `Warnings: ${totalWarnings}`,
        `Progress Health Score: ${progressIntegrityResult.healthScore?.toFixed(1) || 0}%`,
        userId ? `User-specific check included` : 'System-wide check'
      ].join('\n');

      if (totalIssues === 0 && progressInconsistencies === 0) {
        toast({
          title: "✅ Data Integrity Check Passed",
          description: summaryMessage,
        });
      } else {
        toast({
          title: "⚠️ Data Integrity Issues Found",
          description: summaryMessage,
          variant: "destructive",
        });
      }

      // Log detailed results
      if (userResult.issues.length > 0) console.error('User data issues:', userResult.issues);
      if (assignmentResult.issues.length > 0) console.error('Assignment data issues:', assignmentResult.issues);
      if (progressResult.issues.length > 0) console.error('Progress data issues:', progressResult.issues);
      if (progressInconsistencies > 0) console.warn('Progress inconsistencies detected:', progressInconsistencies);
      
      return {
        isValid: totalIssues === 0 && progressInconsistencies === 0,
        userResult,
        assignmentResult,
        progressResult,
        progressIntegrityResult,
        summary: {
          totalIssues,
          totalWarnings,
          progressInconsistencies,
          progressHealthScore: progressIntegrityResult.healthScore || 0,
          userSummary: userResult.summary,
          assignmentSummary: assignmentResult.summary,
          progressSummary: progressResult.summary
        }
      };

    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    
    // User operations
    protectedRoleUpdate,
    protectedUserDeactivation,
    protectedUserRestoration,
    
    // Assignment operations
    protectedBulkAssign,
    protectedRemoveAssignments,
    
    // Progress operations
    protectedProgressReset,
    protectedBulkComplete,
    protectedProgressRecalculation,
    protectedProgressDiagnosis,
    
    // Admin unit completion operations
    protectedAdminMarkUnitComplete,
    protectedBulkAdminMarkUnitsComplete,
    
    // Enhanced validation
    validateAllDataIntegrity,
    
    // Individual validators
    validateUserDataIntegrity,
    validateAssignmentIntegrity,
    validateProgressIntegrity
  };
};
