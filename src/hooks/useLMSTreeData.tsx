
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

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
      console.log('Fetching courses and restructuring hierarchy...');
      
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
        console.error('Error fetching courses:', coursesError);
        throw coursesError;
      }

      // Transform the data to handle the migration case
      const transformedCourses = coursesData?.map(course => {
        // Check if we have a "Main Module" situation (migration case)
        const mainModule = course.modules?.find(m => 
          m.title === "Main Module" || 
          (m.description && m.description.includes("Default module created during migration"))
        );

        if (mainModule && mainModule.lessons && mainModule.lessons.length > 0) {
          // Convert lessons under Main Module to be modules themselves
          const newModules = mainModule.lessons.map((lesson, index) => ({
            id: lesson.id,
            course_id: course.id,
            title: lesson.title,
            description: lesson.description,
            image_url: lesson.image_url,
            sort_order: index,
            is_draft: lesson.is_draft,
            created_at: lesson.created_at,
            updated_at: lesson.updated_at,
            lessons: lesson.units?.map((unit, unitIndex) => ({
              id: unit.id,
              course_id: course.id,
              module_id: lesson.id, // This will be the new module ID
              title: unit.title,
              description: unit.description,
              image_url: null,
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
          
          return {
            ...course,
            modules: [...otherModules, ...newModules]
          };
        }

        return course;
      }) || [];

      console.log('Transformed courses with proper hierarchy:', transformedCourses);
      return transformedCourses as CourseWithContent[];
    },
  });

  return {
    courses,
    isLoading,
    refetch,
  };
};
