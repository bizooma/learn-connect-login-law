
import { CourseFormData, ModuleData } from "../types";
import { createModulesFromData } from "./moduleCreation";
import { createLessonsAndUnits } from "./sectionCreation";

export const createCourseWithModules = async (courseId: string, data: CourseFormData, modules: ModuleData[]) => {
  console.log('Creating course with modules:', { courseId, modules });
  
  if (modules.length === 0) {
    console.log('No modules provided, skipping module creation');
    return;
  }
  
  // Create modules first
  const createdModules = await createModulesFromData(courseId, modules);
  
  // Then create lessons and units for each module
  for (const module of createdModules) {
    if (module.lessons && module.lessons.length > 0) {
      console.log('Creating lessons for module:', module.id);
      
      // Convert lessons to the format expected by createLessonsAndUnits
      const sectionsData = module.lessons.map(lesson => ({
        ...lesson,
        units: lesson.units || []
      }));
      
      await createLessonsAndUnits(courseId, sectionsData, module.id);
    }
  }
  
  console.log('Course creation with modules completed');
};
