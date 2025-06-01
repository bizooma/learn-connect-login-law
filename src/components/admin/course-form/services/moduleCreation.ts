
import { supabase } from "@/integrations/supabase/client";

export const createDefaultModule = async (courseId: string) => {
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title: 'Main Module',
      description: 'Primary course content',
      sort_order: 0,
    })
    .select()
    .single();

  if (moduleError) {
    console.error('Error creating default module:', moduleError);
    throw new Error(`Failed to create default module: ${moduleError.message}`);
  }

  return moduleData;
};
