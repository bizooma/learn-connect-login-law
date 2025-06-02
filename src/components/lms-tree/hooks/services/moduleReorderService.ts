import { supabase } from "@/integrations/supabase/client";
import { ReorderConfig } from "../types/reorderTypes";
import { validateReorderBounds, swapSortOrders } from "./reorderUtils";

export const reorderModule = async (moduleId: string, direction: 'up' | 'down', config: ReorderConfig) => {
  try {
    console.log('=== REORDER MODULE DEBUG ===');
    console.log('Module ID:', moduleId);
    console.log('Direction:', direction);

    // First, check if this is actually a lesson displayed as a module
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, sort_order, course_id, module_id, title')
      .eq('id', moduleId)
      .maybeSingle();

    if (lessonData && !lessonError) {
      console.log('Found lesson-as-module, handling special reordering');
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
      console.log('Found actual module, handling normal reordering');
      await handleActualModuleReordering(moduleData, direction, config);
      return;
    }

    throw new Error('Item not found in either modules or lessons table');

  } catch (error) {
    console.error('Error reordering module:', error);
    config.toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reorder module",
      variant: "destructive",
    });
  }
};

const handleActualModuleReordering = async (moduleData: any, direction: 'up' | 'down', config: ReorderConfig) => {
  console.log('Handling actual module reordering for:', moduleData);
  
  // Get all modules in the same course
  const { data: siblings, error: siblingsError } = await supabase
    .from('modules')
    .select('id, sort_order, title')
    .eq('course_id', moduleData.course_id)
    .order('sort_order');

  if (siblingsError) {
    console.error('Error fetching module siblings:', siblingsError);
    throw siblingsError;
  }

  console.log('Module siblings:', siblings);

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
  console.log('Handling lesson-as-module reordering for:', lessonData);
  
  // Get ALL lessons in the course that are displayed as modules
  // These are lessons that belong to modules created from the migration
  const { data: allLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, sort_order, title, module_id, course_id')
    .eq('course_id', lessonData.course_id)
    .order('sort_order');

  if (lessonsError) {
    console.error('Error fetching all lessons:', lessonsError);
    throw lessonsError;
  }

  console.log('All lessons in course:', allLessons);

  // Get the module information to understand the structure
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, description')
    .eq('id', lessonData.module_id)
    .maybeSingle();

  if (moduleError) {
    console.error('Error fetching module data:', moduleError);
    throw moduleError;
  }

  console.log('Module data:', moduleData);

  // Filter lessons that are displayed as modules
  // In the migrated structure, these are lessons that are the ONLY lesson in their module
  // and the module was created from the original lesson
  const moduleLessons = [];
  
  // Group lessons by module_id
  const lessonsByModule = allLessons.reduce((acc, lesson) => {
    if (!acc[lesson.module_id]) {
      acc[lesson.module_id] = [];
    }
    acc[lesson.module_id].push(lesson);
    return acc;
  }, {} as Record<string, any[]>);

  // Only include lessons that are the sole lesson in their module (these are displayed as modules)
  for (const [moduleId, lessons] of Object.entries(lessonsByModule)) {
    if (lessons.length === 1) {
      moduleLessons.push(lessons[0]);
    }
  }

  console.log('Lessons displayed as modules:', moduleLessons);

  const currentIndex = moduleLessons.findIndex(s => s.id === lessonData.id);
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  console.log('Current index:', currentIndex, 'Target index:', targetIndex);

  if (!validateReorderBounds(currentIndex, targetIndex, moduleLessons, direction, config)) {
    return;
  }

  const current = moduleLessons[currentIndex];
  const target = moduleLessons[targetIndex];

  console.log('Swapping lesson sort orders:', current.title, 'with:', target.title);

  await swapSortOrders('lessons', current, target, config);
};
