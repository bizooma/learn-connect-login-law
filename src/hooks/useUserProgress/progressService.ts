
import { supabase } from "@/integrations/supabase/client";
import { CourseProgress, UnitProgress } from "./types";
import { progressCalculator } from "./progressCalculator";

export const progressService = {
  async fetchUserProgress(userId: string) {
    console.log('progressService: Fetching user progress for user:', userId);
    
    // First, get all course assignments for this user
    const { data: assignments, error: assignmentsError } = await supabase
      .from('course_assignments')
      .select('course_id')
      .eq('user_id', userId);

    if (assignmentsError) {
      console.error('Error fetching course assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log('progressService: Found assignments:', assignments);

    if (!assignments || assignments.length === 0) {
      console.log('progressService: No course assignments found for user');
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
      console.error('Error fetching progress:', progressError);
      throw progressError;
    }

    console.log('progressService: Found progress data:', progressData);

    // For courses that are assigned but don't have progress records yet, create entries
    const existingCourseIds = progressData?.map(p => p.course_id) || [];
    const missingCourseIds = assignedCourseIds.filter(id => !existingCourseIds.includes(id));

    if (missingCourseIds.length > 0) {
      console.log('progressService: Creating progress entries for missing courses:', missingCourseIds);
      
      // Get course details for missing courses
      const { data: missingCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('id', missingCourseIds);

      if (coursesError) {
        console.error('Error fetching missing courses:', coursesError);
        throw coursesError;
      }

      // Create progress entries for missing courses
      for (const courseId of missingCourseIds) {
        try {
          await supabase
            .from('user_course_progress')
            .upsert({
              user_id: userId,
              course_id: courseId,
              status: 'not_started',
              progress_percentage: 0,
              started_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,course_id'
            });
        } catch (error) {
          console.warn('Error creating progress entry for course:', courseId, error);
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
    console.log('progressService: Updating course progress:', { courseId, updates });
    
    try {
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id'
        });

      if (error) {
        console.error('Error upserting course progress:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating course progress:', error);
      // Only throw non-duplicate errors to prevent spam
      if (error.code !== '23505') {
        throw error;
      }
    }
  },

  async markUnitComplete(userId: string, unitId: string, courseId: string) {
    console.log('progressService: Marking unit complete:', { unitId, courseId, userId });
    
    if (!userId || !unitId || !courseId) {
      throw new Error('Missing required parameters: userId, unitId, or courseId');
    }
    
    try {
      // Use upsert to handle both insert and update cases
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
          onConflict: 'user_id,unit_id,course_id'
        });

      if (error) {
        console.error('Error upserting unit progress:', error);
        throw error;
      }
      
      console.log('progressService: Unit marked as complete successfully');
    } catch (error) {
      console.error('Error marking unit complete:', error);
      // Only throw non-duplicate errors to prevent spam
      if (error.code !== '23505') {
        throw error;
      }
    }
  },

  async calculateCourseProgress(userId: string, courseId: string) {
    return progressCalculator.calculateCourseProgress(userId, courseId);
  }
};
