import { supabase } from "@/integrations/supabase/client";

export interface AssignmentOperationResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  backupId?: string;
  assignmentsProcessed: number;
  assignmentsFailed: number;
}

export interface AssignmentBackupData {
  backupId: string;
  timestamp: string;
  assignments: any[];
  userProgress: any[];
  affectedUsers: string[];
}

export const createAssignmentBackup = async (userIds: string[], courseIds: string[]): Promise<AssignmentOperationResult> => {
  try {
    console.log('Creating assignment backup for users:', userIds.length, 'courses:', courseIds.length);
    
    // Fetch existing assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select('*')
      .in('user_id', userIds)
      .in('course_id', courseIds);

    if (assignmentsError) {
      return {
        success: false,
        errors: [`Failed to backup assignments: ${assignmentsError.message}`],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: 0
      };
    }

    // Fetch user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_course_progress')
      .select('*')
      .in('user_id', userIds)
      .in('course_id', courseIds);

    if (progressError) {
      console.warn('Failed to backup progress data:', progressError);
    }

    const backupData: AssignmentBackupData = {
      backupId: `assignment_backup_${Date.now()}`,
      timestamp: new Date().toISOString(),
      assignments: assignments || [],
      userProgress: progress || [],
      affectedUsers: userIds
    };

    console.log('Assignment backup created:', {
      backupId: backupData.backupId,
      assignments: backupData.assignments.length,
      progress: backupData.userProgress.length
    });

    return {
      success: true,
      data: backupData,
      errors: [],
      warnings: progressError ? ['Failed to backup some progress data'] : [],
      assignmentsProcessed: backupData.assignments.length,
      assignmentsFailed: 0
    };

  } catch (error) {
    console.error('Error creating assignment backup:', error);
    return {
      success: false,
      errors: [`Backup failed: ${error.message}`],
      warnings: [],
      assignmentsProcessed: 0,
      assignmentsFailed: 0
    };
  }
};

export const safeBulkAssignCourse = async (
  userIds: string[],
  courseId: string,
  assignedBy: string,
  options: {
    dueDate?: string;
    isMandatory?: boolean;
    notes?: string;
  } = {}
): Promise<AssignmentOperationResult> => {
  try {
    console.log('Starting safe bulk course assignment:', { userIds: userIds.length, courseId });
    
    // Create backup first
    const backupResult = await createAssignmentBackup(userIds, [courseId]);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before assignment', ...backupResult.errors],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: 0
      };
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Process assignments in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      for (const userId of batch) {
        try {
          // Check if assignment already exists
          const { data: existing } = await supabase
            .from('course_assignments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

          if (existing) {
            warnings.push(`User ${userId} already has this course assigned`);
            continue;
          }

          // Create new assignment
          const { error: assignError } = await supabase
            .from('course_assignments')
            .insert({
              user_id: userId,
              course_id: courseId,
              assigned_by: assignedBy,
              due_date: options.dueDate,
              is_mandatory: options.isMandatory || false,
              notes: options.notes
            });

          if (assignError) {
            errors.push(`Failed to assign course to user ${userId}: ${assignError.message}`);
            failCount++;
          } else {
            successCount++;
          }

        } catch (error) {
          errors.push(`Error processing user ${userId}: ${error.message}`);
          failCount++;
        }
      }
    }

    console.log('Bulk assignment completed:', { successCount, failCount });

    return {
      success: successCount > 0,
      data: { successCount, failCount },
      errors,
      warnings,
      backupId: backupResult.data?.backupId,
      assignmentsProcessed: successCount,
      assignmentsFailed: failCount
    };

  } catch (error) {
    console.error('Error in safe bulk assignment:', error);
    return {
      success: false,
      errors: [`Bulk assignment failed: ${error.message}`],
      warnings: [],
      assignmentsProcessed: 0,
      assignmentsFailed: 0
    };
  }
};

export const safeRemoveAssignments = async (
  assignmentIds: string[],
  reason: string = 'Administrative removal'
): Promise<AssignmentOperationResult> => {
  try {
    console.log('Starting safe assignment removal:', assignmentIds.length);
    
    // Get assignment details for backup
    const { data: assignments, error: fetchError } = await supabase
      .from('course_assignments')
      .select('*')
      .in('id', assignmentIds);

    if (fetchError) {
      return {
        success: false,
        errors: [`Failed to fetch assignments for backup: ${fetchError.message}`],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: 0
      };
    }

    if (!assignments || assignments.length === 0) {
      return {
        success: false,
        errors: ['No assignments found to remove'],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: 0
      };
    }

    // Create backup
    const userIds = [...new Set(assignments.map(a => a.user_id))];
    const courseIds = [...new Set(assignments.map(a => a.course_id))];
    
    const backupResult = await createAssignmentBackup(userIds, courseIds);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before removal', ...backupResult.errors],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: 0
      };
    }

    // Remove assignments
    const { error: removeError } = await supabase
      .from('course_assignments')
      .delete()
      .in('id', assignmentIds);

    if (removeError) {
      return {
        success: false,
        errors: [`Failed to remove assignments: ${removeError.message}`],
        warnings: [],
        assignmentsProcessed: 0,
        assignmentsFailed: assignmentIds.length
      };
    }

    console.log('Assignments removed successfully:', assignmentIds.length);

    return {
      success: true,
      data: { removedCount: assignmentIds.length },
      errors: [],
      warnings: [],
      backupId: backupResult.data?.backupId,
      assignmentsProcessed: assignmentIds.length,
      assignmentsFailed: 0
    };

  } catch (error) {
    console.error('Error in safe assignment removal:', error);
    return {
      success: false,
      errors: [`Assignment removal failed: ${error.message}`],
      warnings: [],
      assignmentsProcessed: 0,
      assignmentsFailed: 0
    };
  }
};

export const validateAssignmentIntegrity = async () => {
  try {
    console.log('Validating assignment data integrity...');
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for orphaned assignments (assignments to non-existent users)
    const { data: orphanedUserAssignments } = await supabase
      .from('course_assignments')
      .select('id, user_id')
      .not('user_id', 'in', `(SELECT id FROM profiles WHERE is_deleted = false)`);
    
    if (orphanedUserAssignments && orphanedUserAssignments.length > 0) {
      issues.push(`Found ${orphanedUserAssignments.length} assignments to deleted/non-existent users`);
    }
    
    // Check for orphaned assignments (assignments to non-existent courses)
    const { data: orphanedCourseAssignments } = await supabase
      .from('course_assignments')
      .select('id, course_id')
      .not('course_id', 'in', `(SELECT id FROM courses)`);
    
    if (orphanedCourseAssignments && orphanedCourseAssignments.length > 0) {
      issues.push(`Found ${orphanedCourseAssignments.length} assignments to non-existent courses`);
    }
    
    // Check for duplicate assignments
    const { data: allAssignments } = await supabase
      .from('course_assignments')
      .select('user_id, course_id');
    
    if (allAssignments) {
      const seen = new Map();
      const duplicates: any[] = [];
      
      allAssignments.forEach(assignment => {
        const key = `${assignment.user_id}-${assignment.course_id}`;
        if (seen.has(key)) {
          duplicates.push(assignment);
        } else {
          seen.set(key, assignment);
        }
      });
      
      if (duplicates.length > 0) {
        warnings.push(`Found ${duplicates.length} duplicate assignments`);
      }
    }
    
    // Get summary statistics
    const [assignmentsResult, progressResult] = await Promise.all([
      supabase.from('course_assignments').select('id', { count: 'exact', head: true }),
      supabase.from('user_course_progress').select('id', { count: 'exact', head: true })
    ]);
    
    console.log('Assignment integrity validation completed:', {
      isValid: issues.length === 0,
      issueCount: issues.length,
      warningCount: warnings.length
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      summary: {
        totalAssignments: assignmentsResult.count || 0,
        totalProgress: progressResult.count || 0,
        orphanedUserAssignments: orphanedUserAssignments?.length || 0,
        orphanedCourseAssignments: orphanedCourseAssignments?.length || 0
      }
    };
    
  } catch (error) {
    console.error('Error validating assignment integrity:', error);
    return {
      isValid: false,
      issues: [`Integrity validation failed: ${error.message}`],
      warnings: [],
      summary: {}
    };
  }
};
