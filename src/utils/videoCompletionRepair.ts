
import { supabase } from "@/integrations/supabase/client";

interface VideoCompletionRepairResult {
  repairedUsers: number;
  repairedVideos: number;
  createdVideoRecords?: number;
  updatedUnitProgress?: number;
  errors: string[];
  details: Array<{
    userId: string;
    unitId: string;
    issue: string;
    fixed: boolean;
  }>;
}

export const repairVideoCompletionData = async (
  courseId?: string,
  userId?: string
): Promise<VideoCompletionRepairResult> => {
  const result: VideoCompletionRepairResult = {
    repairedUsers: 0,
    repairedVideos: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🔧 Starting video completion data repair...', { courseId, userId });

    // Find users with video progress issues
    let query = supabase
      .from('user_video_progress')
      .select(`
        user_id,
        unit_id,
        course_id,
        watch_percentage,
        is_completed,
        watched_duration_seconds,
        user_unit_progress!inner(
          video_completed,
          video_completed_at
        )
      `)
      .gte('watch_percentage', 80); // Videos watched to at least 80%

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: progressData, error } = await query;

    if (error) {
      result.errors.push(`Query error: ${error.message}`);
      return result;
    }

    if (!progressData || progressData.length === 0) {
      console.log('ℹ️ No video progress issues found');
      return result;
    }

    console.log(`🔍 Found ${progressData.length} potential video completion issues`);

    // Process each progress record
    for (const progress of progressData) {
      try {
        const unitProgress = progress.user_unit_progress as any;
        let needsRepair = false;
        let repairReason = '';

        // Check for inconsistencies
        if (progress.watch_percentage >= 95 && !progress.is_completed) {
          needsRepair = true;
          repairReason = 'Video watched 95%+ but not marked complete in video_progress';
        } else if (progress.watch_percentage >= 95 && !unitProgress?.video_completed) {
          needsRepair = true;
          repairReason = 'Video watched 95%+ but not marked complete in unit_progress';
        } else if (progress.is_completed && !unitProgress?.video_completed) {
          needsRepair = true;
          repairReason = 'Video marked complete in video_progress but not unit_progress';
        }

        if (needsRepair) {
          console.log(`🔧 Repairing video completion for user ${progress.user_id}, unit ${progress.unit_id}: ${repairReason}`);

          const completedAt = new Date().toISOString();

          // Repair both tables
          const repairs = await Promise.allSettled([
            supabase
              .from('user_video_progress')
              .update({
                is_completed: true,
                completed_at: completedAt,
                watch_percentage: Math.max(progress.watch_percentage, 95),
                updated_at: completedAt
              })
              .eq('user_id', progress.user_id)
              .eq('unit_id', progress.unit_id)
              .eq('course_id', progress.course_id),

            supabase
              .from('user_unit_progress')
              .upsert({
                user_id: progress.user_id,
                unit_id: progress.unit_id,
                course_id: progress.course_id,
                video_completed: true,
                video_completed_at: completedAt,
                updated_at: completedAt
              }, {
                onConflict: 'user_id,unit_id,course_id'
              })
          ]);

          const allSucceeded = repairs.every(r => r.status === 'fulfilled');

          result.details.push({
            userId: progress.user_id,
            unitId: progress.unit_id,
            issue: repairReason,
            fixed: allSucceeded
          });

          if (allSucceeded) {
            result.repairedVideos++;
          } else {
            result.errors.push(`Failed to repair ${progress.user_id}/${progress.unit_id}: ${repairs.find(r => r.status === 'rejected')}`);
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${progress.user_id}/${progress.unit_id}: ${error}`);
      }
    }

    result.repairedUsers = new Set(result.details.filter(d => d.fixed).map(d => d.userId)).size;

    console.log('✅ Video completion repair completed:', {
      repairedUsers: result.repairedUsers,
      repairedVideos: result.repairedVideos,
      totalErrors: result.errors.length
    });

  } catch (error) {
    console.error('❌ Video completion repair failed:', error);
    result.errors.push(`Critical error: ${error}`);
  }

  return result;
};

// Specific repair for Legal Training-200 and Julio's issues
export const repairLegalTraining200 = async (): Promise<VideoCompletionRepairResult> => {
  console.log('🔧 Starting Legal Training-200 specific repair...');

  // Get the course ID for Legal Training-200
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .ilike('title', '%Legal Training-200%')
    .single();

  if (!course) {
    return {
      repairedUsers: 0,
      repairedVideos: 0,
      errors: ['Legal Training-200 course not found'],
      details: []
    };
  }

  return repairVideoCompletionData(course.id);
};

// Enhanced repair function to fix missing video progress data (Julio's issue)
export const repairMissingVideoProgress = async (
  courseId?: string,
  userId?: string
): Promise<VideoCompletionRepairResult> => {
  const result: VideoCompletionRepairResult = {
    repairedUsers: 0,
    repairedVideos: 0,
    createdVideoRecords: 0,
    updatedUnitProgress: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🔧 Starting missing video progress repair...', { courseId, userId });

    // Find completed units with video content but missing video progress records
    let unitQuery = supabase
      .from('user_unit_progress')
      .select(`
        user_id,
        unit_id,
        course_id,
        completed,
        completed_at,
        video_completed,
        video_completed_at,
        units!inner(
          video_url,
          title
        )
      `)
      .eq('completed', true)
      .not('units.video_url', 'is', null); // Only units with video content

    if (courseId) {
      unitQuery = unitQuery.eq('course_id', courseId);
    }

    if (userId) {
      unitQuery = unitQuery.eq('user_id', userId);
    }

    const { data: completedUnits, error: unitError } = await unitQuery;

    if (unitError) {
      result.errors.push(`Unit query error: ${unitError.message}`);
      return result;
    }

    if (!completedUnits || completedUnits.length === 0) {
      console.log('ℹ️ No completed units with videos found');
      return result;
    }

    console.log(`🔍 Found ${completedUnits.length} completed units with video content`);

    // Check which ones are missing video progress records
    for (const unitProgress of completedUnits) {
      try {
        // Check if video progress record exists
        const { data: existingVideoProgress } = await supabase
          .from('user_video_progress')
          .select('id')
          .eq('user_id', unitProgress.user_id)
          .eq('unit_id', unitProgress.unit_id)
          .eq('course_id', unitProgress.course_id)
          .maybeSingle();

        const needsVideoProgressRecord = !existingVideoProgress;
        const needsVideoCompletedFlag = !unitProgress.video_completed;
        let repairReason = '';

        if (needsVideoProgressRecord && needsVideoCompletedFlag) {
          repairReason = 'Missing video progress record and video_completed flag';
        } else if (needsVideoProgressRecord) {
          repairReason = 'Missing video progress record';
        } else if (needsVideoCompletedFlag) {
          repairReason = 'Missing video_completed flag';
        }

        if (needsVideoProgressRecord || needsVideoCompletedFlag) {
          console.log(`🔧 Repairing missing video data for user ${unitProgress.user_id}, unit ${unitProgress.unit_id}: ${repairReason}`);

          const completedAt = unitProgress.completed_at || new Date().toISOString();
          const repairs = [];

          // Create missing video progress record if needed
          if (needsVideoProgressRecord) {
            repairs.push(
              supabase
                .from('user_video_progress')
                .insert({
                  user_id: unitProgress.user_id,
                  unit_id: unitProgress.unit_id,
                  course_id: unitProgress.course_id,
                  watch_percentage: 100,
                  is_completed: true,
                  completed_at: completedAt,
                  last_watched_at: completedAt,
                  watched_duration_seconds: 300, // Default 5 minutes
                  total_duration_seconds: 300,
                  created_at: completedAt,
                  updated_at: completedAt
                })
            );
          }

          // Update video_completed flag if needed
          if (needsVideoCompletedFlag) {
            repairs.push(
              supabase
                .from('user_unit_progress')
                .update({
                  video_completed: true,
                  video_completed_at: completedAt,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', unitProgress.user_id)
                .eq('unit_id', unitProgress.unit_id)
                .eq('course_id', unitProgress.course_id)
            );
          }

          const repairResults = await Promise.allSettled(repairs);
          const allSucceeded = repairResults.every(r => r.status === 'fulfilled');

          result.details.push({
            userId: unitProgress.user_id,
            unitId: unitProgress.unit_id,
            issue: repairReason,
            fixed: allSucceeded
          });

          if (allSucceeded) {
            result.repairedVideos++;
            if (needsVideoProgressRecord) result.createdVideoRecords!++;
            if (needsVideoCompletedFlag) result.updatedUnitProgress!++;
          } else {
            const failedRepair = repairResults.find(r => r.status === 'rejected') as PromiseRejectedResult;
            result.errors.push(`Failed to repair ${unitProgress.user_id}/${unitProgress.unit_id}: ${failedRepair?.reason}`);
          }
        }
      } catch (error) {
        result.errors.push(`Error processing ${unitProgress.user_id}/${unitProgress.unit_id}: ${error}`);
      }
    }

    result.repairedUsers = new Set(result.details.filter(d => d.fixed).map(d => d.userId)).size;

    console.log('✅ Missing video progress repair completed:', {
      repairedUsers: result.repairedUsers,
      repairedVideos: result.repairedVideos,
      createdVideoRecords: result.createdVideoRecords,
      updatedUnitProgress: result.updatedUnitProgress,
      totalErrors: result.errors.length
    });

  } catch (error) {
    console.error('❌ Missing video progress repair failed:', error);
    result.errors.push(`Critical error: ${error}`);
  }

  return result;
};
