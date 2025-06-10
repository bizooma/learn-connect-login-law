
import { supabase } from "@/integrations/supabase/client";

export interface AdminUnitCompletionResult {
  success: boolean;
  completedUnits: number;
  failedUnits: number;
  errors: string[];
  warnings: string[];
  backupId?: string;
  affectedUsers: string[];
}

interface DatabaseFunctionResponse {
  success: boolean;
  user_id: string;
  unit_id: string;
  course_id: string;
  audit_id: string;
  message: string;
}

export const safeAdminMarkUnitComplete = async (
  userId: string,
  unitId: string,
  courseId: string,
  reason: string = 'Administrative completion'
): Promise<AdminUnitCompletionResult> => {
  const result: AdminUnitCompletionResult = {
    success: false,
    completedUnits: 0,
    failedUnits: 0,
    errors: [],
    warnings: [],
    affectedUsers: []
  };

  try {
    console.log('🔧 Admin unit completion:', { userId, unitId, courseId, reason });

    // Call the database function
    const { data, error } = await supabase.rpc('admin_mark_unit_completed', {
      p_user_id: userId,
      p_unit_id: unitId,
      p_course_id: courseId,
      p_reason: reason
    });

    if (error) {
      result.errors.push(`Failed to mark unit complete: ${error.message}`);
      result.failedUnits = 1;
      return result;
    }

    // Type the response properly
    const response = data as DatabaseFunctionResponse;
    
    if (response?.success) {
      result.success = true;
      result.completedUnits = 1;
      result.affectedUsers = [userId];
      result.backupId = response.audit_id;
      
      console.log('✅ Unit marked complete successfully:', response);
    } else {
      result.errors.push('Database function returned failure');
      result.failedUnits = 1;
    }

  } catch (error: any) {
    console.error('❌ Error in admin unit completion:', error);
    result.errors.push(error.message || 'Unknown error occurred');
    result.failedUnits = 1;
  }

  return result;
};

export const safeBulkAdminMarkUnitsComplete = async (
  assignments: Array<{ userId: string; unitId: string; courseId: string }>,
  reason: string = 'Bulk administrative completion'
): Promise<AdminUnitCompletionResult> => {
  const result: AdminUnitCompletionResult = {
    success: false,
    completedUnits: 0,
    failedUnits: 0,
    errors: [],
    warnings: [],
    affectedUsers: []
  };

  try {
    console.log('🔧 Bulk admin unit completion:', { count: assignments.length, reason });

    const promises = assignments.map(({ userId, unitId, courseId }) =>
      safeAdminMarkUnitComplete(userId, unitId, courseId, reason)
    );

    const results = await Promise.allSettled(promises);
    const affectedUsersSet = new Set<string>();

    results.forEach((promiseResult, index) => {
      if (promiseResult.status === 'fulfilled') {
        const individualResult = promiseResult.value;
        result.completedUnits += individualResult.completedUnits;
        result.failedUnits += individualResult.failedUnits;
        result.errors.push(...individualResult.errors);
        result.warnings.push(...individualResult.warnings);
        individualResult.affectedUsers.forEach(user => affectedUsersSet.add(user));
      } else {
        result.failedUnits++;
        result.errors.push(`Assignment ${index + 1}: ${promiseResult.reason}`);
      }
    });

    result.affectedUsers = Array.from(affectedUsersSet);
    result.success = result.completedUnits > 0;

    if (result.failedUnits > 0) {
      result.warnings.push(`${result.failedUnits} units failed to complete`);
    }

  } catch (error: any) {
    console.error('❌ Error in bulk admin unit completion:', error);
    result.errors.push(error.message || 'Unknown error occurred');
    result.failedUnits = assignments.length;
  }

  return result;
};

export const validateAdminUnitCompletion = async (
  userId: string,
  unitId: string,
  courseId: string
): Promise<{ isValid: boolean; issues: string[]; warnings: string[] }> => {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if user exists and is assigned to course
    const { data: assignment, error: assignmentError } = await supabase
      .from('course_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (assignmentError || !assignment) {
      issues.push('User is not assigned to this course');
    }

    // Check if unit exists in the course
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select(`
        id,
        title,
        lessons!inner(course_id)
      `)
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      issues.push('Unit does not exist');
    } else if (unit.lessons.course_id !== courseId) {
      issues.push('Unit does not belong to the specified course');
    }

    // Check if unit is already completed
    const { data: progress, error: progressError } = await supabase
      .from('user_unit_progress')
      .select('completed, completion_method')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .eq('course_id', courseId)
      .single();

    if (!progressError && progress?.completed) {
      warnings.push(`Unit is already completed via ${progress.completion_method}`);
    }

  } catch (error: any) {
    issues.push(`Validation error: ${error.message}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
};
