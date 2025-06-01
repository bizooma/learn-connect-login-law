
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;

export const cleanupExistingCourseContent = async (courseId: string) => {
  // Delete existing units first
  const { data: existingModules } = await supabase
    .from('modules')
    .select('id, lessons(id, units(id))')
    .eq('course_id', courseId);

  if (existingModules) {
    for (const module of existingModules) {
      const moduleData = module as Module & { lessons: (Lesson & { units: Unit[] })[] };
      for (const lesson of moduleData.lessons || []) {
        if (lesson.units?.length > 0) {
          await supabase
            .from('units')
            .delete()
            .in('id', lesson.units.map(u => u.id));
        }
      }
    }
  }

  // Delete existing lessons
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .in('module_id', existingModules?.map(m => m.id) || []);

  if (deleteError) console.error('Error deleting lessons:', deleteError);

  // Delete existing modules
  const { error: deleteModulesError } = await supabase
    .from('modules')
    .delete()
    .eq('course_id', courseId);

  if (deleteModulesError) console.error('Error deleting modules:', deleteModulesError);
};
