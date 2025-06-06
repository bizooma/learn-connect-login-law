
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";

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

export const createModulesFromData = async (courseId: string, modules: ModuleData[]) => {
  console.log('Creating modules from data:', modules);
  
  const createdModules = [];
  
  for (let i = 0; i < modules.length; i++) {
    const moduleData = modules[i];
    
    console.log('Creating module:', moduleData.title);
    
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: moduleData.title || `Module ${i + 1}`,
        description: moduleData.description || '',
        image_url: moduleData.image_url || null,
        file_url: moduleData.file_url || null,
        file_name: moduleData.file_name || null,
        file_size: moduleData.file_size || 0,
        sort_order: i,
      })
      .select()
      .single();

    if (moduleError) {
      console.error('Error creating module:', moduleError);
      throw new Error(`Failed to create module: ${moduleError.message}`);
    }

    console.log('Module created:', module);
    createdModules.push({ ...module, lessons: moduleData.lessons });
  }
  
  return createdModules;
};
