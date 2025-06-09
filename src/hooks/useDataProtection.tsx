
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

export const useDataProtection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const showOperationResult = (result: any, operationType: string) => {
    if (result.success) {
      const successMessage = [
        `${operationType} completed successfully!`,
        result.backupId ? `Backup ID: ${result.backupId}` : '',
        `Processed: ${result.assignmentsProcessed || result.progressRecordsProcessed || 'N/A'}`,
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

  // Integrity validation
  const validateAllDataIntegrity = async (userId?: string) => {
    setIsProcessing(true);
    try {
      console.log('🔍 Running comprehensive data integrity check...');
      
      const [userResult, assignmentResult, progressResult] = await Promise.all([
        userId ? validateUserDataIntegrity(userId) : Promise.resolve({ isValid: true, issues: [], warnings: [], summary: {} }),
        validateAssignmentIntegrity(),
        validateProgressIntegrity()
      ]);

      const totalIssues = userResult.issues.length + assignmentResult.issues.length + progressResult.issues.length;
      const totalWarnings = userResult.warnings.length + assignmentResult.warnings.length + progressResult.warnings.length;

      const summaryMessage = [
        `Data Integrity Check ${totalIssues === 0 ? 'PASSED' : 'FAILED'}`,
        `Critical Issues: ${totalIssues}`,
        `Warnings: ${totalWarnings}`,
        userId ? `User-specific check included` : 'System-wide check'
      ].join('\n');

      if (totalIssues === 0) {
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
      
      return {
        isValid: totalIssues === 0,
        userResult,
        assignmentResult,
        progressResult,
        summary: {
          totalIssues,
          totalWarnings,
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
    
    // Validation
    validateAllDataIntegrity,
    
    // Individual validators
    validateUserDataIntegrity,
    validateAssignmentIntegrity,
    validateProgressIntegrity
  };
};
