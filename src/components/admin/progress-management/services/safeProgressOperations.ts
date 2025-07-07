
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface ProgressOperationResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
  backupId?: string;
  progressRecordsProcessed: number;
  progressRecordsFailed: number;
}

export interface ProgressBackupData {
  backupId: string;
  timestamp: string;
  courseProgress: any[];
  unitProgress: any[];
  videoProgress: any[];
  certificates: any[];
  affectedUsers: string[];
}

export const createProgressBackup = async (userIds: string[], courseIds?: string[]): Promise<ProgressOperationResult> => {
  try {
    logger.log('Creating progress backup for users:', userIds.length, 'courses:', courseIds?.length || 'all');
    
    // Build queries
    let courseProgressQuery = supabase.from('user_course_progress').select('*').in('user_id', userIds);
    let unitProgressQuery = supabase.from('user_unit_progress').select('*').in('user_id', userIds);
    let videoProgressQuery = supabase.from('user_video_progress').select('*').in('user_id', userIds);
    let certificatesQuery = supabase.from('user_certificates').select('*').in('user_id', userIds);
    
    if (courseIds && courseIds.length > 0) {
      courseProgressQuery = courseProgressQuery.in('course_id', courseIds);
      unitProgressQuery = unitProgressQuery.in('course_id', courseIds);
      videoProgressQuery = videoProgressQuery.in('course_id', courseIds);
      certificatesQuery = certificatesQuery.in('course_id', courseIds);
    }
    
    // Fetch all progress data
    const [courseResult, unitResult, videoResult, certificateResult] = await Promise.all([
      courseProgressQuery,
      unitProgressQuery,
      videoProgressQuery,
      certificatesQuery
    ]);

    const backupData: ProgressBackupData = {
      backupId: `progress_backup_${Date.now()}`,
      timestamp: new Date().toISOString(),
      courseProgress: courseResult.data || [],
      unitProgress: unitResult.data || [],
      videoProgress: videoResult.data || [],
      certificates: certificateResult.data || [],
      affectedUsers: userIds
    };

    const totalRecords = backupData.courseProgress.length + 
                        backupData.unitProgress.length + 
                        backupData.videoProgress.length + 
                        backupData.certificates.length;

    logger.log('Progress backup created:', {
      backupId: backupData.backupId,
      totalRecords,
      breakdown: {
        courseProgress: backupData.courseProgress.length,
        unitProgress: backupData.unitProgress.length,
        videoProgress: backupData.videoProgress.length,
        certificates: backupData.certificates.length
      }
    });

    return {
      success: true,
      data: backupData,
      errors: [],
      warnings: [],
      progressRecordsProcessed: totalRecords,
      progressRecordsFailed: 0
    };

  } catch (error) {
    logger.error('Error creating progress backup:', error);
    return {
      success: false,
      errors: [`Progress backup failed: ${error.message}`],
      warnings: [],
      progressRecordsProcessed: 0,
      progressRecordsFailed: 0
    };
  }
};

export const safeResetUserProgress = async (
  userId: string,
  courseId?: string,
  reason: string = 'Administrative reset'
): Promise<ProgressOperationResult> => {
  try {
    logger.log('Starting safe progress reset for user:', userId, 'course:', courseId || 'all');
    
    // Create backup first
    const backupResult = await createProgressBackup([userId], courseId ? [courseId] : undefined);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before reset', ...backupResult.errors],
        warnings: [],
        progressRecordsProcessed: 0,
        progressRecordsFailed: 0
      };
    }

    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsFailed = 0;

    // Reset course progress
    try {
      let courseQuery = supabase.from('user_course_progress').delete().eq('user_id', userId);
      if (courseId) {
        courseQuery = courseQuery.eq('course_id', courseId);
      }
      
      const { error: courseError } = await courseQuery;
      if (courseError) {
        errors.push(`Failed to reset course progress: ${courseError.message}`);
        recordsFailed++;
      } else {
        recordsProcessed++;
      }
    } catch (error) {
      errors.push(`Error resetting course progress: ${error.message}`);
      recordsFailed++;
    }

    // Reset unit progress
    try {
      let unitQuery = supabase.from('user_unit_progress').delete().eq('user_id', userId);
      if (courseId) {
        unitQuery = unitQuery.eq('course_id', courseId);
      }
      
      const { error: unitError } = await unitQuery;
      if (unitError) {
        errors.push(`Failed to reset unit progress: ${unitError.message}`);
        recordsFailed++;
      } else {
        recordsProcessed++;
      }
    } catch (error) {
      errors.push(`Error resetting unit progress: ${error.message}`);
      recordsFailed++;
    }

    // Reset video progress
    try {
      let videoQuery = supabase.from('user_video_progress').delete().eq('user_id', userId);
      if (courseId) {
        videoQuery = videoQuery.eq('course_id', courseId);
      }
      
      const { error: videoError } = await videoQuery;
      if (videoError) {
        errors.push(`Failed to reset video progress: ${videoError.message}`);
        recordsFailed++;
      } else {
        recordsProcessed++;
      }
    } catch (error) {
      errors.push(`Error resetting video progress: ${error.message}`);
      recordsFailed++;
    }

    logger.log('Progress reset completed:', { recordsProcessed, recordsFailed });

    return {
      success: recordsProcessed > 0,
      data: { recordsProcessed, recordsFailed },
      errors,
      warnings: [],
      backupId: backupResult.data?.backupId,
      progressRecordsProcessed: recordsProcessed,
      progressRecordsFailed: recordsFailed
    };

  } catch (error) {
    logger.error('Error in safe progress reset:', error);
    return {
      success: false,
      errors: [`Progress reset failed: ${error.message}`],
      warnings: [],
      progressRecordsProcessed: 0,
      progressRecordsFailed: 0
    };
  }
};

export const safeBulkMarkCompleted = async (
  assignments: Array<{ userId: string; courseId: string }>,
  completionDate?: string
): Promise<ProgressOperationResult> => {
  try {
    logger.log('Starting safe bulk completion marking:', assignments.length);
    
    const userIds = [...new Set(assignments.map(a => a.userId))];
    const courseIds = [...new Set(assignments.map(a => a.courseId))];
    
    // Create backup first
    const backupResult = await createProgressBackup(userIds, courseIds);
    if (!backupResult.success) {
      return {
        success: false,
        errors: ['Failed to create backup before marking completed', ...backupResult.errors],
        warnings: [],
        progressRecordsProcessed: 0,
        progressRecordsFailed: 0
      };
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Process completions in batches
    const batchSize = 5;
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      
      for (const { userId, courseId } of batch) {
        try {
          // Use the existing RPC function for marking completed
          const { error } = await supabase.rpc('mark_course_completed', {
            p_user_id: userId,
            p_course_id: courseId,
            p_completion_date: completionDate || new Date().toISOString()
          });

          if (error) {
            errors.push(`Failed to mark course ${courseId} completed for user ${userId}: ${error.message}`);
            failCount++;
          } else {
            successCount++;
          }

        } catch (error) {
          errors.push(`Error processing completion for user ${userId}, course ${courseId}: ${error.message}`);
          failCount++;
        }
      }
    }

    logger.log('Bulk completion marking completed:', { successCount, failCount });

    return {
      success: successCount > 0,
      data: { successCount, failCount },
      errors,
      warnings,
      backupId: backupResult.data?.backupId,
      progressRecordsProcessed: successCount,
      progressRecordsFailed: failCount
    };

  } catch (error) {
    logger.error('Error in safe bulk completion marking:', error);
    return {
      success: false,
      errors: [`Bulk completion marking failed: ${error.message}`],
      warnings: [],
      progressRecordsProcessed: 0,
      progressRecordsFailed: 0
    };
  }
};

export const validateProgressIntegrity = async () => {
  try {
    logger.log('Validating progress data integrity...');
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for orphaned progress records (progress for deleted users)
    const { data: orphanedUserProgress } = await supabase
      .from('user_course_progress')
      .select('id, user_id')
      .not('user_id', 'in', `(SELECT id FROM profiles WHERE is_deleted = false)`);
    
    if (orphanedUserProgress && orphanedUserProgress.length > 0) {
      issues.push(`Found ${orphanedUserProgress.length} progress records for deleted/non-existent users`);
    }
    
    // Check for orphaned progress records (progress for deleted courses)
    const { data: orphanedCourseProgress } = await supabase
      .from('user_course_progress')
      .select('id, course_id')
      .not('course_id', 'in', `(SELECT id FROM courses)`);
    
    if (orphanedCourseProgress && orphanedCourseProgress.length > 0) {
      issues.push(`Found ${orphanedCourseProgress.length} progress records for non-existent courses`);
    }
    
    // Check for invalid progress percentages
    const { data: invalidProgress } = await supabase
      .from('user_course_progress')
      .select('id, progress_percentage, status')
      .or('progress_percentage.lt.0,progress_percentage.gt.100');
    
    if (invalidProgress && invalidProgress.length > 0) {
      issues.push(`Found ${invalidProgress.length} records with invalid progress percentages`);
    }
    
    // Check for status/percentage mismatches
    const { data: statusMismatches } = await supabase
      .from('user_course_progress')
      .select('id, progress_percentage, status')
      .eq('status', 'completed')
      .lt('progress_percentage', 100);
    
    if (statusMismatches && statusMismatches.length > 0) {
      warnings.push(`Found ${statusMismatches.length} completed courses with progress < 100%`);
    }
    
    // Get summary statistics
    const [progressResult, unitProgressResult, certificatesResult] = await Promise.all([
      supabase.from('user_course_progress').select('id', { count: 'exact', head: true }),
      supabase.from('user_unit_progress').select('id', { count: 'exact', head: true }),
      supabase.from('user_certificates').select('id', { count: 'exact', head: true })
    ]);
    
    logger.log('Progress integrity validation completed:', {
      isValid: issues.length === 0,
      issueCount: issues.length,
      warningCount: warnings.length
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      summary: {
        totalCourseProgress: progressResult.count || 0,
        totalUnitProgress: unitProgressResult.count || 0,
        totalCertificates: certificatesResult.count || 0,
        orphanedUserProgress: orphanedUserProgress?.length || 0,
        orphanedCourseProgress: orphanedCourseProgress?.length || 0,
        invalidProgress: invalidProgress?.length || 0
      }
    };
    
  } catch (error) {
    console.error('Error validating progress integrity:', error);
    return {
      isValid: false,
      issues: [`Integrity validation failed: ${error.message}`],
      warnings: [],
      summary: {}
    };
  }
};
