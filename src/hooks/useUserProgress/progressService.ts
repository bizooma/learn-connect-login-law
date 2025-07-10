
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

    // Get progress data for assigned courses
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
      logger.log('progressService: Creating progress entries for missing courses:', missingCourseIds);
      
      // Get course details for missing courses
      const { data: missingCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', missingCourseIds);

      if (coursesError) {
        logger.error('Error fetching missing courses:', coursesError);
        throw coursesError;
      }

      // Create progress entries for missing courses with improved error handling
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
            logger.warn('Error creating progress entry for course:', courseId, createError);
            // Continue with other courses even if one fails
          }
        } catch (error) {
          logger.warn('Exception creating progress entry for course:', courseId, error);
          // Continue processing other courses
        }
      }

      // Fetch updated progress data
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
    logger.log('progressService: Updating course progress:', { courseId, updates });
    
    try {
      // Use defensive UPSERT with better error handling
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (error) {
        // Handle constraint violations gracefully
        if (error.code === '23505' && error.message?.includes('duplicate key')) {
          logger.log('Course progress record exists, attempting update instead of insert');
          
          // Try direct update
          const { error: updateError } = await supabase
            .from('user_course_progress')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('course_id', courseId);

          if (updateError) {
            logger.error('Direct update also failed:', updateError);
            throw updateError;
          }
          
          logger.log('Course progress updated via direct update');
          return;
        }
        
        logger.error('Error upserting course progress:', error);
        throw error;
      }
      
      logger.log('Course progress updated successfully');
    } catch (error) {
      logger.error('Error updating course progress:', error);
      throw error;
    }
  },

  async markUnitComplete(userId: string, unitId: string, courseId: string) {
    logger.log('progressService: Marking unit complete:', { unitId, courseId, userId });
    
    if (!userId || !unitId || !courseId) {
      throw new Error('Missing required parameters: userId, unitId, or courseId');
    }
    
    try {
      // Use defensive UPSERT with improved error handling
      const { error } = await supabase
        .from('user_unit_progress')
        .upsert({
          user_id: userId,
          unit_id: unitId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,unit_id,course_id',
          ignoreDuplicates: false
        });

      if (error) {
        // Handle constraint violations gracefully
        if (error.code === '23505' && error.message?.includes('duplicate key')) {
          logger.log('Unit progress record exists, attempting update instead of insert');
          
          // Try direct update
          const { error: updateError } = await supabase
            .from('user_unit_progress')
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('unit_id', unitId)
            .eq('course_id', courseId);

          if (updateError) {
            logger.error('Direct unit progress update failed:', updateError);
            throw updateError;
          }
          
          logger.log('Unit progress updated via direct update');
          return;
        }
        
        logger.error('Error upserting unit progress:', error);
        throw error;
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
