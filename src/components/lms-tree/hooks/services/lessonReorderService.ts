
import { supabase } from "@/integrations/supabase/client";
import { ReorderConfig } from "../types/reorderTypes";
import { validateReorderBounds, swapSortOrders } from "./reorderUtils";
import { logger } from "@/utils/logger";

export const reorderLesson = async (lessonId: string, direction: 'up' | 'down', config: ReorderConfig) => {
  try {
    logger.log('=== REORDER LESSON DEBUG ===');
    logger.log('Lesson ID:', lessonId);
    logger.log('Direction:', direction);

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('sort_order, module_id, title, course_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError) {
      logger.error('Error fetching lesson:', lessonError);
      throw lessonError;
    }

    if (!lessonData) {
      throw new Error('Lesson not found');
    }

    logger.log('Lesson data:', lessonData);

    const { data: siblings, error: siblingsError } = await supabase
      .from('lessons')
      .select('id, sort_order, title')
      .eq('module_id', lessonData.module_id)
      .order('sort_order');

    if (siblingsError) {
      logger.error('Error fetching lesson siblings:', siblingsError);
      throw siblingsError;
    }

    logger.log('Lesson siblings:', siblings);

    const currentIndex = siblings.findIndex(s => s.id === lessonId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (!validateReorderBounds(currentIndex, targetIndex, siblings, direction, config)) {
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];

    await swapSortOrders('lessons', current, target, config);
  } catch (error) {
    logger.error('Error reordering lesson:', error);
    config.toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reorder lesson",
      variant: "destructive",
    });
  }
};
