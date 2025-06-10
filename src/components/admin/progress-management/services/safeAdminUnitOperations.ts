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

// Helper function to recalculate course progress after unit completion
const recalculateCourseProgress = async (userId: string, courseId: string) => {
  console.log('🔄 Recalculating course progress after admin unit completion');
  
  try {
    // Get all units in the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        units!inner(id)
      `)
      .eq('course_id', courseId);

    if (lessonsError) {
      console.error('Error fetching lessons for progress calculation:', lessonsError);
      return;
    }

    const allUnits = lessons?.flatMap(lesson => lesson.units) || [];
    const totalUnits = allUnits.length;

    if (totalUnits === 0) {
      console.log('No units found for course, skipping progress calculation');
      return;
    }

    // Get completed units
    const { data: completedUnits, error: progressError } = await supabase
      .from('user_unit_progress')
      .select('unit_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true);

    if (progressError) {
      console.error('Error fetching unit progress:', progressError);
      return;
    }

    const completedCount = completedUnits?.length || 0;
    const progressPercentage = Math.round((completedCount / totalUnits) * 100);
    const status = progressPercentage === 100 ? 'completed' : 
                  progressPercentage > 0 ? 'in_progress' : 'not_started';

    console.log(`📊 Course progress calculated: ${completedCount}/${totalUnits} units = ${progressPercentage}%`);

    // Update course progress
    const { error: updateError } = await supabase
      .from('user_course_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        status,
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating course progress:', updateError);
    } else {
      console.log('✅ Course progress updated successfully');
    }
  } catch (error) {
    console.error('Error in course progress recalculation:', error);
  }
};

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

    // Type the response properly - cast through unknown first
    const response = data as unknown as DatabaseFunctionResponse;
    
    if (response?.success) {
      result.success = true;
      result.completedUnits = 1;
      result.affectedUsers = [userId];
      result.backupId = response.audit_id;
      
      console.log('✅ Unit marked complete successfully:', response);
      
      // Recalculate course progress after successful unit completion
      await recalculateCourseProgress(userId, courseId);
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
    // First check if the unit actually belongs to the course by traversing the relationships
    const { data: unitWithCourse, error: unitError } = await supabase
      .from('units')
      .select(`
        id,
        title,
        section_id,
        lessons!inner(
          id,
          course_id
        )
      `)
      .eq('id', unitId)
      .single();

    if (unitError || !unitWithCourse) {
      issues.push('Unit does not exist');
      return { isValid: false, issues, warnings };
    }

    // Check if the unit's lesson belongs to the specified course
    if (unitWithCourse.lessons.course_id !== courseId) {
      issues.push('Unit does not belong to the specified course');
      return { isValid: false, issues, warnings };
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      issues.push('User does not exist');
      return { isValid: false, issues, warnings };
    }

    // Check if user has course assignment OR course progress (more flexible check)
    const { data: assignment, error: assignmentError } = await supabase
      .from('course_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    const { data: progress, error: progressError } = await supabase
      .from('user_course_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    // If neither assignment nor progress exists, the user might not be properly enrolled
    if ((!assignment && assignmentError) && (!progress && progressError)) {
      warnings.push('User may not be properly enrolled in this course, but override will create necessary records');
    } else if (!assignment && !progress) {
      warnings.push('No existing assignment or progress found - will be created during override');
    }

    // Check if unit is already completed
    const { data: unitProgress, error: unitProgressError } = await supabase
      .from('user_unit_progress')
      .select('completed, completion_method')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (!unitProgressError && unitProgress?.completed) {
      warnings.push(`Unit is already completed via ${unitProgress.completion_method}`);
    }

  } catch (error: any) {
    console.error('Validation error:', error);
    issues.push(`Validation error: ${error.message}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
};
