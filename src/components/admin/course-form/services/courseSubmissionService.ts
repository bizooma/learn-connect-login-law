
import { CourseFormData, ModuleData } from "../types";
import { createModulesFromData } from "./moduleCreation";
import { createLessonsAndUnits } from "./sectionCreation";

export const createCourseWithModules = async (courseId: string, data: CourseFormData, modules: ModuleData[]) => {
  console.log('Creating course with modules:', { courseId, modules });
  
  if (modules.length === 0) {
    console.log('No modules provided, skipping module creation');
    return;
  }
  
  // Ensure modules have proper sort_order before creation
  const modulesWithSortOrder = modules.map((module, index) => ({
    ...module,
    sort_order: index,
    lessons: module.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      sort_order: lessonIndex,
      units: lesson.units.map((unit, unitIndex) => ({
        ...unit,
        sort_order: unitIndex
      }))
    }))
  }));
  
  // Create modules first
  const createdModules = await createModulesFromData(courseId, modulesWithSortOrder);
  
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
