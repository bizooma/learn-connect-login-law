
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";
import { logger } from "@/utils/logger";

export const createModulesFromData = async (courseId: string, modules: ModuleData[]) => {
  logger.log('Creating modules for course:', courseId, 'Modules:', modules);
  
  const createdModules = [];
  
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    logger.log('Creating module:', module.title, 'with sort_order:', i);
    
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .insert({
        course_id: courseId,
        title: module.title,
        description: module.description,
        image_url: module.image_url || null,
        file_url: module.file_url || null,
        file_name: module.file_name || null,
        file_size: module.file_size || null,
        sort_order: i // Use index to ensure proper order
      })
      .select()
      .single();

    if (moduleError) {
      logger.error('Error creating module:', moduleError);
      throw new Error(`Failed to create module: ${moduleError.message}`);
    }

    logger.log('Module created:', moduleData);
    
    // Attach the lessons data for later processing
    createdModules.push({
      ...moduleData,
      lessons: module.lessons || []
    });
  }
  
  return createdModules;
};

export const createDefaultModule = async (courseId: string) => {
  logger.log('Creating default module for course:', courseId);
  
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title: 'Main Module',
      description: 'Default module for course content',
      sort_order: 0
    })
    .select()
    .single();

  if (moduleError) {
    logger.error('Error creating default module:', moduleError);
    throw new Error(`Failed to create default module: ${moduleError.message}`);
  }

  logger.log('Default module created:', moduleData);
  return moduleData;
};
