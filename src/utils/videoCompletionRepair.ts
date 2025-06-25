
import { supabase } from "@/integrations/supabase/client";

interface VideoCompletionRepairResult {
  repairedUsers: number;
  repairedVideos: number;
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
