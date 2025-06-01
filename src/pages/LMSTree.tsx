
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LMSTreeHeader from "@/components/lms-tree/LMSTreeHeader";
import LMSTreeContent from "@/components/lms-tree/LMSTreeContent";
import LMSTreeLoading from "@/components/lms-tree/LMSTreeLoading";
import LMSTreeFooter from "@/components/lms-tree/LMSTreeFooter";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;
type Quiz = Tables<'quizzes'>;

interface CourseWithContent extends Course {
  modules: (Module & {
    lessons: (Lesson & {
      units: (Unit & {
        quizzes: Quiz[];
      })[];
    })[];
  })[];
}

const LMSTree = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

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

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in course title and description
    if (course.title?.toLowerCase().includes(searchLower) || 
        course.description?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in modules, lessons, and units
    return course.modules?.some(module => 
      module.title?.toLowerCase().includes(searchLower) ||
      module.description?.toLowerCase().includes(searchLower) ||
      module.lessons?.some(lesson =>
        lesson.title?.toLowerCase().includes(searchLower) ||
        lesson.description?.toLowerCase().includes(searchLower) ||
        lesson.units?.some(unit =>
          unit.title?.toLowerCase().includes(searchLower) ||
          unit.description?.toLowerCase().includes(searchLower)
        )
      )
    );
  });

  const handleToggleCourse = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleToggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleToggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <LMSTreeLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LMSTreeHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalCourses={courses.length}
      />
      
      <div className="flex-1">
        <LMSTreeContent
          courses={filteredCourses}
          expandedCourses={expandedCourses}
          expandedModules={expandedModules}
          expandedLessons={expandedLessons}
          onToggleCourse={handleToggleCourse}
          onToggleModule={handleToggleModule}
          onToggleLesson={handleToggleLesson}
          onRefetch={refetch}
        />
      </div>
      
      <LMSTreeFooter />
    </div>
  );
};

export default LMSTree;
