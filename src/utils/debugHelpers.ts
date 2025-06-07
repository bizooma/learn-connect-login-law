
import { supabase } from "@/integrations/supabase/client";

export const debugLessonOrder = async () => {
  try {
    // Find all lessons with these titles
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, sort_order, course_id')
      .or('title.ilike.%5 Characteristics%,title.ilike.%4 Steps%');
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return;
    }
    
    console.log('Found lessons:', lessons);
    
    // Group by course_id
    const courseGroups = lessons?.reduce((acc, lesson) => {
      if (!acc[lesson.course_id]) {
        acc[lesson.course_id] = [];
      }
      acc[lesson.course_id].push(lesson);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    console.log('Lessons grouped by course:', courseGroups);
    
    return courseGroups;
  } catch (error) {
    console.error('Error in debugLessonOrder:', error);
  }
};
