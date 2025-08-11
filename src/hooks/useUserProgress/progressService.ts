
import { supabase } from "@/integrations/supabase/client";
import { CourseProgress, UnitProgress } from "./types";
import { progressCalculator } from "./progressCalculator";
import { logger } from "@/utils/logger";

export const progressService = {
  async fetchUserProgress(userId: string) {
    logger.log('progressService: Fetching user progress for user:', userId);
    
    // First, get all course assignments for this user
    const { data: assignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select('course_id')
      .eq('user_id', userId);

    if (assignmentsError) {
      logger.error('Error fetching course assignments:', assignmentsError);
      throw assignmentsError;
    }

    logger.log('progressService: Found assignments:', assignments);

    if (!assignments || assignments.length === 0) {
      logger.log('progressService: No course assignments found for user');
      return [];
    }

    const assignedCourseIds = assignments.map(a => a.course_id);

    // Get progress data ONLY for assigned courses
    const { data: progressData, error: progressError } = await supabase
      .from('user_course_progress')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', userId)
      .in('course_id', assignedCourseIds)
      .order('last_accessed_at', { ascending: false });

    if (progressError) {
      logger.error('Error fetching progress:', progressError);
      throw progressError;
    }

    logger.log('progressService: Found progress data:', progressData);

    // For courses that are assigned but don't have progress records yet, create entries
    const existingCourseIds = progressData?.map(p => p.course_id) || [];
    const missingCourseIds = assignedCourseIds.filter(id => !existingCourseIds.includes(id));

    if (missingCourseIds.length > 0) {
      logger.log('progressService: Creating progress entries for assigned courses without progress:', missingCourseIds);
      
      // Create progress entries ONLY for assigned courses that don't have progress
      for (const courseId of missingCourseIds) {
        try {
          const { error: createError } = await supabase
            .from('user_course_progress')
            .upsert({
              user_id: userId,
              course_id: courseId,
              status: 'not_started',
              progress_percentage: 0,
              started_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,course_id',
              ignoreDuplicates: true
            });

          if (createError) {
            logger.warn('Error creating progress entry for assigned course:', courseId, createError);
          }
        } catch (error) {
          logger.warn('Exception creating progress entry for assigned course:', courseId, error);
        }
      }

      // Fetch updated progress data for assigned courses only
      const { data: updatedProgressData } = await supabase
        .from('user_course_progress')
        .select(`
          *,
          courses (*)
        `)
        .eq('user_id', userId)
        .in('course_id', assignedCourseIds)
        .order('last_accessed_at', { ascending: false });

      return updatedProgressData || [];
    }

    return progressData || [];
  },

  async updateCourseProgress(userId: string, courseId: string, updates: Partial<CourseProgress>) {
    logger.log('progressService: Recalculating course progress via RPC:', { courseId });
    try {
      const { data, error } = await supabase.rpc(
        'update_course_progress_reliable' as any,
        { p_user_id: userId, p_course_id: courseId }
      );
      if (error) {
        logger.error('RPC update_course_progress_reliable failed:', error);
        throw error;
      }
      logger.log('Course progress recalculated', data);
    } catch (error) {
      logger.error('Error updating course progress:', error);
      throw error;
    }
  },

  async markUnitComplete(userId: string, unitId: string, courseId: string) {
    logger.log('progressService: Marking unit complete (smart RPC):', { unitId, courseId, userId });
    if (!userId || !unitId || !courseId) {
      throw new Error('Missing required parameters: userId, unitId, or courseId');
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logger.warn('Could not fetch auth user; defaulting to user RPC', authError);
      }
      const currentUserId = authData?.user?.id;

      if (currentUserId && currentUserId === userId) {
        const { error } = await supabase.rpc(
          'mark_unit_complete_reliable' as any,
          { p_unit_id: unitId, p_course_id: courseId, p_completion_method: 'manual' }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc(
          'admin_mark_unit_completed' as any,
          { p_user_id: userId, p_unit_id: unitId, p_course_id: courseId, p_reason: 'Admin-triggered from progressService' }
        );
        if (error) throw error;
      }

      logger.log('progressService: Unit marked as complete successfully');
    } catch (error) {
      logger.error('Error marking unit complete:', error);
      throw error;
    }
  },

  async calculateCourseProgress(userId: string, courseId: string) {
    try {
      return await progressCalculator.calculateCourseProgress(userId, courseId);
    } catch (error) {
      logger.error('Error in calculateCourseProgress:', error);
      // Return safe defaults if calculation fails
      return {
        progressPercentage: 0,
        status: 'not_started' as const
      };
    }
  }
};
