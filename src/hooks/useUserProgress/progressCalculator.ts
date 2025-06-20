
import { supabase } from "@/integrations/supabase/client";

export const progressCalculator = {
  async calculateCourseProgress(userId: string, courseId: string) {
    console.log('Calculating course progress for:', courseId);
    
    try {
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
        return { progressPercentage: 0, status: 'not_started' as const };
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

      // Determine status based on progress
      let status: 'not_started' | 'in_progress' | 'completed';
      if (progressPercentage === 100) {
        status = 'completed';
      } else if (progressPercentage > 0) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }

      // If course is completed, automatically update the course progress with better error handling
      if (status === 'completed') {
        console.log('Course completed! Updating course progress to completed status');
        try {
          await this.markCourseCompleted(userId, courseId);
        } catch (markCompletedError) {
          console.error('Failed to mark course as completed, but progress calculation succeeded:', markCompletedError);
          // Don't throw - the progress calculation itself was successful
        }
      }

      return { progressPercentage, status };
    } catch (error) {
      console.error('Error calculating course progress:', error);
      throw error;
    }
  },

  async markCourseCompleted(userId: string, courseId: string) {
    try {
      console.log('Marking course as completed:', { userId, courseId });
      
      // Use defensive UPSERT with better conflict handling
      const { error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (error) {
        // Check if it's a constraint violation we can safely ignore
        if (error.code === '23505' && error.message?.includes('duplicate key')) {
          console.log('Course progress already exists, updating existing record');
          
          // Try a direct update instead
          const { error: updateError } = await supabase
            .from('user_course_progress')
            .update({
              status: 'completed',
              progress_percentage: 100,
              completed_at: new Date().toISOString(),
              last_accessed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('course_id', courseId);

          if (updateError) {
            console.error('Failed to update existing course progress:', updateError);
            throw updateError;
          }
          
          console.log('Course marked as completed via update');
          return;
        }
        
        console.error('Error marking course as completed:', error);
        throw error;
      }

      console.log('Course marked as completed successfully');
    } catch (error) {
      console.error('Error in markCourseCompleted:', error);
      throw error;
    }
  },

  async getDetailedCourseStats(userId: string, courseId: string) {
    try {
      // Get course info
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      // Get total lessons and units
      const { data: lessons } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          units (
            id,
            title
          )
        `)
        .eq('course_id', courseId);

      // Get user's completed units
      const { data: completedUnits } = await supabase
        .from('user_unit_progress')
        .select('unit_id, completed_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

      const totalLessons = lessons?.length || 0;
      const totalUnits = lessons?.reduce((acc, lesson) => acc + (lesson.units?.length || 0), 0) || 0;
      const completedUnitsCount = completedUnits?.length || 0;

      return {
        courseTitle: course?.title || 'Unknown Course',
        totalLessons,
        totalUnits,
        completedUnits: completedUnitsCount,
        progressPercentage: totalUnits > 0 ? Math.round((completedUnitsCount / totalUnits) * 100) : 0,
        lessons: lessons || []
      };
    } catch (error) {
      console.error('Error getting detailed course stats:', error);
      throw error;
    }
  }
};
