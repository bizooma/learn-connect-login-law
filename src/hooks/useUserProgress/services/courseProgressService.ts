
import { supabase } from "@/integrations/supabase/client";
import { CourseProgress } from "../types";

export const courseProgressService = {
  async updateCourseProgress(userId: string, courseId: string, updates: Partial<CourseProgress>) {
    console.log('Updating course progress:', { courseId, updates });
    
    // First, try to get existing record
    const { data: existingRecord, error: selectError } = await supabase
      .from('user_course_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let result;
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('user_course_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('course_id', courseId);
    } else {
      // Insert new record
      result = await supabase
        .from('user_course_progress')
        .insert({
          user_id: userId,
          course_id: courseId,
          ...updates,
          updated_at: new Date().toISOString()
        });
    }

    if (result.error) {
      // Handle duplicate key error gracefully
      if (result.error.code === '23505') {
        console.log('Duplicate key detected, attempting update instead');
        const updateResult = await supabase
          .from('user_course_progress')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('course_id', courseId);
        
        if (updateResult.error) {
          throw updateResult.error;
        }
      } else {
        throw result.error;
      }
    }
  },

  async calculateCourseProgress(userId: string, courseId: string) {
    console.log('Calculating course progress for:', courseId);
    
    // Get total units in course by first getting lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    const lessonIds = lessons?.map(s => s.id) || [];
    
    if (lessonIds.length === 0) {
      console.log('No lessons found for course:', courseId);
      return { progressPercentage: 0, status: 'not_started' };
    }

    // Get total units in these lessons
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id')
      .in('section_id', lessonIds);

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      throw unitsError;
    }

    // Get completed units for user
    const { data: completedUnits, error: completedError } = await supabase
      .from('user_unit_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('completed', true);

    if (completedError) {
      console.error('Error fetching completed units:', completedError);
      throw completedError;
    }

    const totalUnits = units?.length || 0;
    const completedCount = completedUnits?.length || 0;
    const progressPercentage = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

    console.log('Progress calculation:', { totalUnits, completedCount, progressPercentage });

    const status = progressPercentage === 100 ? 'completed' : 
                 progressPercentage > 0 ? 'in_progress' : 'not_started';

    return { progressPercentage, status };
  }
};
