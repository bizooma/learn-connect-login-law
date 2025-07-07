
import { supabase } from "@/integrations/supabase/client";
import { ReorderConfig } from "../types/reorderTypes";
import { validateReorderBounds, swapSortOrders } from "./reorderUtils";
import { logger } from "@/utils/logger";

export const reorderModule = async (moduleId: string, direction: 'up' | 'down', config: ReorderConfig) => {
  try {
    logger.log('=== REORDER MODULE DEBUG ===');
    logger.log('Module ID:', moduleId);
    logger.log('Direction:', direction);

    // First, check if this is actually a lesson displayed as a module
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, sort_order, course_id, module_id, title')
      .eq('id', moduleId)
      .maybeSingle();

    if (lessonData && !lessonError) {
      logger.log('Found lesson-as-module, handling special reordering');
      await handleLessonAsModuleReordering(lessonData, direction, config);
      return;
    }

    // Otherwise, handle as actual module
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('id, sort_order, course_id, title')
      .eq('id', moduleId)
      .maybeSingle();

    if (moduleData && !moduleError) {
      logger.log('Found actual module, handling normal reordering');
      await handleActualModuleReordering(moduleData, direction, config);
      return;
    }

    throw new Error('Item not found in either modules or lessons table');

  } catch (error) {
    logger.error('Error reordering module:', error);
    config.toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reorder module",
      variant: "destructive",
    });
  }
};

const handleActualModuleReordering = async (moduleData: any, direction: 'up' | 'down', config: ReorderConfig) => {
  logger.log('Handling actual module reordering for:', moduleData);
  
  // Get all modules in the same course
  const { data: siblings, error: siblingsError } = await supabase
    .from('modules')
    .select('id, sort_order, title')
    .eq('course_id', moduleData.course_id)
    .order('sort_order');

  if (siblingsError) {
    logger.error('Error fetching module siblings:', siblingsError);
    throw siblingsError;
  }

  logger.log('Module siblings:', siblings);

  const currentIndex = siblings.findIndex(s => s.id === moduleData.id);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  console.log('Current index:', currentIndex, 'Target index:', targetIndex);

  if (!validateReorderBounds(currentIndex, targetIndex, siblings, direction, config)) {
    return;
  }

  const current = siblings[currentIndex];
  const target = siblings[targetIndex];

  await swapSortOrders('modules', current, target, config);
};

const handleLessonAsModuleReordering = async (lessonData: any, direction: 'up' | 'down', config: ReorderConfig) => {
  logger.log('Handling lesson-as-module reordering for:', lessonData);
  
  // Get the module to check if this is a "Main Module" scenario
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, description')
    .eq('id', lessonData.module_id)
    .maybeSingle();

  if (moduleError) {
    logger.error('Error fetching module data:', moduleError);
    throw moduleError;
  }

  logger.log('Module data:', moduleData);

  // Check if this is a "Main Module" or migration scenario
  const isMainModule = moduleData?.title === "Main Module" || 
                      moduleData?.title?.includes("Main Module") ||
                      (moduleData?.description && moduleData.description.includes("migration"));

  let moduleLessons;

  if (isMainModule) {
    logger.log('This is a Main Module scenario - treating all lessons as modules');
    // For Main Module, ALL lessons in this module should be treated as modules
    const { data: allLessonsInModule, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, sort_order, title, module_id, course_id')
      .eq('module_id', lessonData.module_id)
      .order('sort_order');

    if (lessonsError) {
      logger.error('Error fetching lessons in module:', lessonsError);
      throw lessonsError;
    }

    moduleLessons = allLessonsInModule || [];
    logger.log('All lessons in Main Module (displayed as modules):', moduleLessons);
  } else {
    // For other cases, get all lessons in the course and find standalone lessons
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id, 
        sort_order, 
        title, 
        module_id, 
        course_id,
        units:units(id)
      `)
      .eq('course_id', lessonData.course_id)
      .order('sort_order');

    if (lessonsError) {
      logger.error('Error fetching all lessons:', lessonsError);
      throw lessonsError;
    }

    // Group lessons by module_id and find modules with single lessons (displayed as modules)
    const lessonsByModule = (allLessons || []).reduce((acc, lesson) => {
      if (!acc[lesson.module_id]) {
        acc[lesson.module_id] = [];
      }
      acc[lesson.module_id].push(lesson);
      return acc;
    }, {} as Record<string, any[]>);

    moduleLessons = [];
    for (const [moduleId, lessons] of Object.entries(lessonsByModule)) {
      // If a module has only one lesson, that lesson should be displayed as a module
      if (lessons.length === 1) {
        moduleLessons.push(lessons[0]);
      }
    }
  }

  logger.log('Final lessons displayed as modules:', moduleLessons);

  if (!moduleLessons || moduleLessons.length === 0) {
    logger.log('No lessons found to reorder');
    config.toast({
      title: "Info",
      description: "No items available to reorder",
    });
    return;
  }

  const currentIndex = moduleLessons.findIndex(s => s.id === lessonData.id);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  console.log('Current index:', currentIndex, 'Target index:', targetIndex);
  logger.log('Available lessons for reordering:', moduleLessons.map(l => ({ id: l.id, title: l.title, sort_order: l.sort_order })));

  if (!validateReorderBounds(currentIndex, targetIndex, moduleLessons, direction, config)) {
    return;
  }

  const current = moduleLessons[currentIndex];
  const target = moduleLessons[targetIndex];

  logger.log('Swapping lesson sort orders:', current.title, 'with:', target.title);

  await swapSortOrders('lessons', current, target, config);
};
