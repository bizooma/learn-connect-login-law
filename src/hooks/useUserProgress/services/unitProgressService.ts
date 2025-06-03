
import { supabase } from "@/integrations/supabase/client";

export const unitProgressService = {
  async markUnitComplete(userId: string, unitId: string, courseId: string) {
    console.log('Marking unit complete:', { unitId, courseId });
    
    // First, try to get existing record
    const { data: existingRecord, error: selectError } = await supabase
      .from('user_unit_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .eq('course_id', courseId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let result;
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('user_unit_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('unit_id', unitId)
        .eq('course_id', courseId);
    } else {
      // Insert new record
      result = await supabase
        .from('user_unit_progress')
        .insert({
          user_id: userId,
          unit_id: unitId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    if (result.error) {
      // Handle duplicate key error gracefully
      if (result.error.code === '23505') {
        console.log('Unit progress already exists, attempting update');
        const updateResult = await supabase
          .from('user_unit_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('unit_id', unitId)
          .eq('course_id', courseId);
        
        if (updateResult.error) {
          throw updateResult.error;
        }
      } else {
        throw result.error;
      }
    }
  }
};
