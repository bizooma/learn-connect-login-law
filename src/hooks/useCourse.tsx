
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;

interface EnhancedUnit extends Unit {
  quiz?: {
    id: string;
    title: string;
    description: string;
    is_active: boolean;
  };
  files?: Array<{ url: string; name: string; size: number }>;
}

interface EnhancedLesson extends Lesson {
  units: EnhancedUnit[];
}

interface EnhancedModule extends Module {
  lessons: EnhancedLesson[];
}

interface EnhancedCourse extends Course {
  modules: EnhancedModule[];
  lessons: EnhancedLesson[];
}

export const useCourse = (courseId: string) => {
  const [course, setCourse] = useState<EnhancedCourse | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<EnhancedUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course with modules, lessons, and units
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            modules:modules(
              *,
              lessons:lessons(
                *,
                units:units(*)
              )
            )
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        if (courseData) {
          // Get all unit IDs for quiz lookup
          const allUnits = courseData.modules?.flatMap(m => 
            m.lessons?.flatMap(l => l.units || []) || []
          ) || [];

          // Fetch quizzes for all units
          const { data: quizzesData } = await supabase
            .from('quizzes')
            .select('id, title, description, is_active, unit_id')
            .in('unit_id', allUnits.map(u => u.id));

          // Create quiz map
          const quizMap = new Map();
          quizzesData?.forEach(quiz => {
            if (quiz.unit_id) {
              quizMap.set(quiz.unit_id, quiz);
            }
          });

          // Enhance units with quiz data and parse files
          const enhancedModules = courseData.modules?.map(module => ({
            ...module,
            lessons: module.lessons?.map(lesson => ({
              ...lesson,
              units: lesson.units?.map(unit => {
                let files: Array<{ url: string; name: string; size: number }> = [];
                
                // Handle the new files format (jsonb array)
                if (unit.files) {
                  try {
                    const parsedFiles = Array.isArray(unit.files) ? unit.files : JSON.parse(unit.files as string);
                    files = Array.isArray(parsedFiles) ? parsedFiles : [];
                  } catch (e) {
                    console.error('Error parsing unit files:', e);
                    files = [];
                  }
                }
                
                // Fallback to legacy single file format if no files array
                if (files.length === 0 && unit.file_url) {
                  files = [{
                    url: unit.file_url,
                    name: unit.file_name || 'Download File',
                    size: unit.file_size || 0
                  }];
                }

                return {
                  ...unit,
                  quiz: quizMap.get(unit.id) || undefined,
                  files
                };
              }) || []
            })) || []
          })) || [];

          // For backward compatibility, also create a flat lessons array
          const flatLessons = enhancedModules.flatMap(m => m.lessons || []);

          const enhancedCourse = {
            ...courseData,
            modules: enhancedModules,
            lessons: flatLessons
          };

          setCourse(enhancedCourse);

          // Auto-select first unit if none selected
          if (!selectedUnit && flatLessons.length > 0) {
            const firstUnit = flatLessons[0]?.units?.[0];
            if (firstUnit) {
              setSelectedUnit(firstUnit);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading,
    error
  };
};
