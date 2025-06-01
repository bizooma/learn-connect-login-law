
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "../types";

export const createSection = async (courseId: string, moduleId: string, section: SectionData) => {
  console.log('Creating section:', section.title);
  
  const { data: sectionData, error: sectionError } = await supabase
    .from('sections')
    .insert({
      course_id: courseId,
      module_id: moduleId,
      title: section.title,
      description: section.description,
      sort_order: section.sort_order,
    })
    .select()
    .single();

  if (sectionError) {
    console.error('Error creating section:', sectionError);
    throw new Error(`Failed to create section: ${sectionError.message}`);
  }

  return sectionData;
};
