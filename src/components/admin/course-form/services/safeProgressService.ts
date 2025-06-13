
import { supabase } from "@/integrations/supabase/client";

export interface ProgressSafetyResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export const ensureSafeProgressCreation = async (
  courseId: string,
  userIds: string[]
): Promise<ProgressSafetyResult> => {
  console.log('🛡️ Ensuring safe progress creation for course:', courseId);
  
  const result: ProgressSafetyResult = {
    success: true,
    errors: [],
    warnings: []
  };
  
  try {
    // Check existing course assignments to avoid duplicates
    const { data: existingAssignments } = await supabase
      .from('course_assignments')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', userIds);
    
    const existingUserIds = existingAssignments?.map(a => a.user_id) || [];
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
    
    if (newUserIds.length === 0) {
      console.log('ℹ️ No new users to create assignments for');
      return result;
    }
    
    // Create course assignments safely with ON CONFLICT handling
    for (const userId of newUserIds) {
      try {
        const { error } = await supabase
          .from('course_assignments')
          .insert({
            user_id: userId,
            course_id: courseId,
            assigned_by: (await supabase.auth.getUser()).data.user?.id,
            assigned_at: new Date().toISOString(),
            notes: 'Created during course update'
          })
          .select()
          .single();
        
        if (error) {
          // Check if it's a duplicate key error (which is expected)
          if (error.code === '23505') {
            result.warnings.push(`Assignment already exists for user ${userId}`);
          } else {
            result.errors.push(`Failed to create assignment for user ${userId}: ${error.message}`);
          }
        } else {
          console.log('✅ Course assignment created for user:', userId);
        }
      } catch (error) {
        result.errors.push(`Unexpected error creating assignment for user ${userId}: ${error.message}`);
      }
    }
    
    // Check for any user progress creation issues
    const { data: progressCheck } = await supabase
      .from('user_course_progress')
      .select('user_id')
      .eq('course_id', courseId)
      .in('user_id', userIds);
    
    const missingProgressUsers = userIds.filter(
      id => !progressCheck?.some(p => p.user_id === id)
    );
    
    if (missingProgressUsers.length > 0) {
      result.warnings.push(`Progress records missing for ${missingProgressUsers.length} users`);
    }
    
  } catch (error) {
    console.error('❌ Error in safe progress creation:', error);
    result.success = false;
    result.errors.push(`Progress creation failed: ${error.message}`);
  }
  
  return result;
};

export const validateProgressConsistency = async (courseId: string): Promise<{
  isConsistent: boolean;
  issues: string[];
}> => {
  console.log('🔍 Validating progress consistency for course:', courseId);
  
  const issues: string[] = [];
  
  try {
    // Check for duplicate progress records
    const { data: duplicateProgress } = await supabase
      .from('user_course_progress')
      .select('user_id, course_id')
      .eq('course_id', courseId);
    
    if (duplicateProgress) {
      const userIds = duplicateProgress.map(p => p.user_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      if (userIds.length !== uniqueUserIds.length) {
        issues.push('Duplicate progress records detected');
      }
    }
    
    // Check for orphaned assignments without progress
    const { data: orphanedAssignments } = await supabase
      .from('course_assignments')
      .select(`
        user_id,
        user_course_progress!left(id)
      `)
      .eq('course_id', courseId)
      .is('user_course_progress.id', null);
    
    if (orphanedAssignments && orphanedAssignments.length > 0) {
      issues.push(`${orphanedAssignments.length} assignments without progress records`);
    }
    
  } catch (error) {
    console.error('❌ Progress validation failed:', error);
    issues.push(`Validation failed: ${error.message}`);
  }
  
  return {
    isConsistent: issues.length === 0,
    issues
  };
};
