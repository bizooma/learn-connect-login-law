
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const debugLessonOrder = async () => {
  try {
    // Find all lessons with these titles
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('id, title, sort_order, course_id')
      .or('title.ilike.%5 Characteristics%,title.ilike.%4 Steps%');
    
    if (error) {
      logger.error('Error fetching lessons:', error);
      return;
    }
    
    logger.log('Found lessons:', lessons);
    
    // Group by course_id
    const courseGroups = lessons?.reduce((acc, lesson) => {
      if (!acc[lesson.course_id]) {
        acc[lesson.course_id] = [];
      }
      acc[lesson.course_id].push(lesson);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    logger.log('Lessons grouped by course:', courseGroups);
    
    return courseGroups;
  } catch (error) {
    logger.error('Error in debugLessonOrder:', error);
  }
};
