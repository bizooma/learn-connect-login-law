
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

export interface CourseWithContent extends Course {
  modules: (Module & {
    lessons: (Lesson & {
      units: (Unit & {
        quizzes: Quiz[];
      })[];
    })[];
  })[];
}

export const useLMSTreeData = () => {
  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['lms-tree-courses'],
    queryFn: async () => {
      logger.log('Fetching courses and restructuring hierarchy...');
      
      // First, get courses with their current structure
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules (
            *,
            lessons (
              *,
              units (
                *,
                quizzes (*)
              )
            )
          )
        `)
        .order('created_at', { ascending: true });

      if (coursesError) {
        logger.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      // Transform the data to handle the migration case and improve display
      const transformedCourses = coursesData?.map(course => {
        logger.log('Processing course:', course.title, 'with modules:', course.modules?.length);
        
        // Check if we have a "Main Module" situation (migration case)
        const mainModule = course.modules?.find(m => 
          m.title === "Main Module" || 
          m.title?.includes("Main Module") ||
          (m.description && m.description.includes("Default module created during migration"))
        );

        if (mainModule && mainModule.lessons && mainModule.lessons.length > 0) {
          logger.log('Found Main Module with lessons, converting to proper hierarchy...');
          
          // Convert ALL lessons under Main Module to be modules themselves
          const newModules = mainModule.lessons.map((lesson, index) => ({
            id: lesson.id,
            course_id: course.id,
            title: lesson.title,
            description: lesson.description,
            image_url: lesson.image_url,
            file_url: lesson.file_url,
            file_name: lesson.file_name,
            file_size: lesson.file_size,
            sort_order: index,
            is_draft: lesson.is_draft,
            created_at: lesson.created_at,
            updated_at: lesson.updated_at,
            lessons: lesson.units?.filter(unit => !unit.is_draft).map((unit, unitIndex) => ({
              id: unit.id,
              course_id: course.id,
              module_id: lesson.id, // This will be the new module ID
              title: unit.title,
              description: unit.description,
              image_url: null,
              file_url: unit.file_url,
              file_name: unit.file_name,
              file_size: unit.file_size,
              sort_order: unitIndex,
              is_draft: unit.is_draft,
              created_at: unit.created_at,
              updated_at: unit.updated_at,
              units: [{
                ...unit,
                section_id: unit.id // Keep reference for quizzes
              }]
            })) || []
          }));

          // Filter out Main Module and add the transformed modules
          const otherModules = course.modules?.filter(m => m.id !== mainModule.id) || [];
          
          logger.log('Converted', newModules.length, 'lessons to modules for course:', course.title);
          
          return {
            ...course,
            modules: [...otherModules, ...newModules].sort((a, b) => a.sort_order - b.sort_order)
          };
        }

        // For courses without Main Module, process normally but check for single-lesson modules and filter draft units
        const processedModules = course.modules?.map(module => {
          // Sort lessons and units properly, filtering out draft units
          if (module.lessons) {
            module.lessons = module.lessons
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(lesson => ({
                ...lesson,
                units: lesson.units?.filter(unit => !unit.is_draft).sort((a, b) => a.sort_order - b.sort_order) || []
              }));
          }
          return module;
        }).sort((a, b) => a.sort_order - b.sort_order) || [];

        return {
          ...course,
          modules: processedModules
        };
      }) || [];

      logger.log('Final transformed courses:', transformedCourses);
      return transformedCourses as CourseWithContent[];
    },
  });

  return {
    courses,
    isLoading,
    refetch,
  };
};
