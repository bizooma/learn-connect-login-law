import { supabase } from "@/integrations/supabase/client";
import { updateUserRoleSafe, softDeleteUserSafe, restoreUserSafe } from "../updatedUserManagementService";

export interface UserOperationResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  backupId?: string;
  rollbackData?: any;
}

export interface UserBackupData {
  backupId: string;
  userId: string;
  timestamp: string;
  profile: any;
  roles: any[];
  courseAssignments: any[];
  progress: any[];
  auditTrail: any[];
}

export const createUserBackup = async (userId: string): Promise<UserOperationResult> => {
  try {
    console.log('Creating comprehensive user backup for:', userId);
    
    // Fetch all user-related data
    const [profileResult, rolesResult, assignmentsResult, progressResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('*').eq('user_id', userId),
      supabase.from('course_assignments').select('*').eq('user_id', userId),
      supabase.from('user_course_progress').select('*').eq('user_id', userId)
    ]);

    const backupData: UserBackupData = {
      backupId: `user_backup_${userId}_${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      profile: profileResult.data,
      roles: rolesResult.data || [],
      courseAssignments: assignmentsResult.data || [],
      progress: progressResult.data || [],
      auditTrail: []
    };

    console.log('User backup created:', {
      backupId: backupData.backupId,
      dataSize: {
        roles: backupData.roles.length,
        assignments: backupData.courseAssignments.length,
        progress: backupData.progress.length
      }
    });

    return {
      success: true,
      data: backupData,
      errors: [],
      warnings: []
    };

  } catch (error) {
    console.error('Error creating user backup:', error);
    return {
      success: false,
      errors: [`Backup failed: ${error.message}`],
      warnings: []
    };
  }
};

export const safeRoleUpdate = async (
  userId: string, 
  newRole: 'admin' | 'owner' | 'student' | 'client' | 'free', 
  reason?: string
): Promise<UserOperationResult> => {
  try {
    console.log('Starting safe role update for:', userId, 'to:', newRole);
    
    // Create backup first
    const backupResult = await createUserBackup(userId);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before role update', ...backupResult.errors],
        warnings: []
      };
    }

    // Perform the role update using existing safe function
    const updateResult = await updateUserRoleSafe(userId, newRole, reason);
    
    return {
      success: true,
      data: updateResult,
      errors: [],
      warnings: [],
      backupId: backupResult.data.backupId,
      rollbackData: backupResult.data
    };

  } catch (error) {
    console.error('Error in safe role update:', error);
    return {
      success: false,
      errors: [`Role update failed: ${error.message}`],
      warnings: []
    };
  }
};

export const safeUserDeactivation = async (
  userId: string, 
  reason: string
): Promise<UserOperationResult> => {
  try {
    console.log('Starting safe user deactivation for:', userId);
    
    // Create comprehensive backup
    const backupResult = await createUserBackup(userId);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before deactivation', ...backupResult.errors],
        warnings: []
      };
    }

    // Perform soft delete using existing safe function
    const deactivationResult = await softDeleteUserSafe(userId, reason);
    
    return {
      success: true,
      data: deactivationResult,
      errors: [],
      warnings: [],
      backupId: backupResult.data.backupId,
      rollbackData: backupResult.data
    };

  } catch (error) {
    console.error('Error in safe user deactivation:', error);
    return {
      success: false,
      errors: [`Deactivation failed: ${error.message}`],
      warnings: []
    };
  }
};

export const safeUserRestoration = async (
  userId: string, 
  reason: string
): Promise<UserOperationResult> => {
  try {
    console.log('Starting safe user restoration for:', userId);
    
    // Create backup of current state
    const backupResult = await createUserBackup(userId);
    
    // Perform restoration using existing safe function
    const restorationResult = await restoreUserSafe(userId, reason);
    
    return {
      success: true,
      data: restorationResult,
      errors: [],
      warnings: [],
      backupId: backupResult.data?.backupId,
      rollbackData: backupResult.data
    };

  } catch (error) {
    console.error('Error in safe user restoration:', error);
    return {
      success: false,
      errors: [`Restoration failed: ${error.message}`],
      warnings: []
    };
  }
};

export const validateUserDataIntegrity = async (userId: string) => {
  try {
    console.log('Validating user data integrity for:', userId);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check profile existence
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      issues.push('User profile not found');
      return { isValid: false, issues, warnings };
    }
    
    // Check role consistency
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (!roles || roles.length === 0) {
      warnings.push('User has no assigned roles');
    } else if (roles.length > 1) {
      warnings.push(`User has multiple roles: ${roles.map(r => r.role).join(', ')}`);
    }
    
    // Check for orphaned assignments
    const { data: assignments } = await supabase
      .from('course_assignments')
      .select('course_id')
      .eq('user_id', userId);
    
    if (assignments && assignments.length > 0) {
      const courseIds = assignments.map(a => a.course_id);
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .in('id', courseIds);
      
      const existingCourseIds = courses?.map(c => c.id) || [];
      const orphanedAssignments = courseIds.filter(id => !existingCourseIds.includes(id));
      
      if (orphanedAssignments.length > 0) {
        issues.push(`Found ${orphanedAssignments.length} assignments to non-existent courses`);
      }
    }
    
    // Check progress data consistency
    const { data: progress } = await supabase
      .from('user_course_progress')
      .select('course_id, status, progress_percentage')
      .eq('user_id', userId);
    
    if (progress) {
      const invalidProgress = progress.filter(p => 
        p.progress_percentage < 0 || 
        p.progress_percentage > 100 ||
        (p.status === 'completed' && p.progress_percentage < 100)
      );
      
      if (invalidProgress.length > 0) {
        issues.push(`Found ${invalidProgress.length} invalid progress records`);
      }
    }
    
    console.log('User data integrity check completed:', {
      userId,
      isValid: issues.length === 0,
      issueCount: issues.length,
      warningCount: warnings.length
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      summary: {
        profile: !!profile,
        roles: roles?.length || 0,
        assignments: assignments?.length || 0,
        progress: progress?.length || 0
      }
    };
    
  } catch (error) {
    console.error('Error validating user data integrity:', error);
    return {
      isValid: false,
      issues: [`Integrity validation failed: ${error.message}`],
      warnings: [],
      summary: {}
    };
  }
};
