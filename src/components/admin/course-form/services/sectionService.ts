
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";
import { logger } from "@/utils/logger";

export const createLesson = async (courseId: string, moduleId: string, lesson: SectionData) => {
  logger.log('Creating lesson:', lesson.title);
  
  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      module_id: moduleId,
      title: lesson.title,
      description: lesson.description,
      sort_order: lesson.sort_order,
    })
    .select()
    .single();

  if (lessonError) {
    logger.error('Error creating lesson:', lessonError);
    throw new Error(`Failed to create lesson: ${lessonError.message}`);
  }

  return lessonData;
};
