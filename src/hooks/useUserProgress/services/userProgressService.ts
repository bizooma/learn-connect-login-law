
import { supabase } from "@/integrations/supabase/client";

export const userProgressService = {
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
  }
};
