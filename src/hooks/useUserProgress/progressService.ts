
import { supabase } from "@/integrations/supabase/client";
import { CourseProgress, UnitProgress } from "./types";
import { progressCalculator } from "./progressCalculator";

export const progressService = {
  async fetchUserProgress(userId: string) {
    console.log('Fetching user progress for user:', userId);
    
    const { data: progressData, error: progressError } = await supabase
      .from('user_course_progress')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      throw progressError;
    }

    console.log('Progress data fetched:', progressData);
    return progressData;
  },

  async updateCourseProgress(userId: string, courseId: string, updates: Partial<CourseProgress>) {
    console.log('Updating course progress:', { courseId, updates });
    
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
    console.log('Marking unit complete:', { unitId, courseId });
    
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
