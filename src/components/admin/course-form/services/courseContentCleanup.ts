
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Module = Tables<'modules'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

export const cleanupExistingCourseContent = async (courseId: string) => {
  // Delete existing units first
  const { data: existingModules } = await supabase
    .from('modules')
    .select('id, sections(id, units(id))')
    .eq('course_id', courseId);

  if (existingModules) {
    for (const module of existingModules) {
      const moduleData = module as Module & { sections: (Section & { units: Unit[] })[] };
      for (const section of moduleData.sections || []) {
        if (section.units?.length > 0) {
          await supabase
            .from('units')
            .delete()
            .in('id', section.units.map(u => u.id));
        }
      }
    }
  }

  // Delete existing sections
  const { error: deleteError } = await supabase
    .from('sections')
    .delete()
    .in('module_id', existingModules?.map(m => m.id) || []);

  if (deleteError) console.error('Error deleting sections:', deleteError);

  // Delete existing modules
  const { error: deleteModulesError } = await supabase
    .from('modules')
    .delete()
    .eq('course_id', courseId);

  if (deleteModulesError) console.error('Error deleting modules:', deleteModulesError);
};
