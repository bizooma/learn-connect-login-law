
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Module = Tables<'modules'>;
type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;

interface EnhancedUnit extends Omit<Unit, 'files'> {
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

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course with modules, lessons, and units with proper ordering
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
        .order('sort_order', { referencedTable: 'modules', ascending: true })
        .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
        .order('sort_order', { referencedTable: 'modules.lessons.units', ascending: true })
        .single();

      if (courseError) throw courseError;

      if (courseData) {
        // Get all unit IDs for quiz lookup - only include non-draft units
        const allUnits = courseData.modules?.flatMap(m => 
          m.lessons?.flatMap(l => l.units?.filter(u => !u.is_draft) || []) || []
        ) || [];

        // Fetch quizzes for all non-draft units
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

        // Enhance modules with proper ordering and filter out draft units
        const enhancedModules = courseData.modules?.map(module => ({
          ...module,
          lessons: module.lessons?.map(lesson => ({
            ...lesson,
            units: lesson.units?.filter(unit => !unit.is_draft).map(unit => {
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
            })?.sort((a, b) => a.sort_order - b.sort_order) || []
          }))?.sort((a, b) => a.sort_order - b.sort_order) || []
        }))?.sort((a, b) => a.sort_order - b.sort_order) || [];

        // For backward compatibility, also create a flat lessons array with proper ordering and filter out draft units
        const flatLessons = enhancedModules.flatMap(m => m.lessons || []);

        const enhancedCourse = {
          ...courseData,
          modules: enhancedModules,
          lessons: flatLessons
        };

        setCourse(enhancedCourse);

        // Auto-select first unit if none selected and we have units
        if (!selectedUnit && flatLessons.length > 0) {
          const firstUnit = flatLessons[0]?.units?.[0];
          if (firstUnit) {
            setSelectedUnit(firstUnit);
          }
        }

        // If current selected unit no longer exists (or was marked as draft), reset selection
        if (selectedUnit) {
          const unitStillExists = flatLessons.some(lesson => 
            lesson.units.some(unit => unit.id === selectedUnit.id && !unit.is_draft)
          );
          if (!unitStillExists) {
            const firstUnit = flatLessons[0]?.units?.[0];
            setSelectedUnit(firstUnit || null);
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

  const refreshCourse = async () => {
    console.log('Refreshing course data...');
    await fetchCourse();
  };

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
  }, [courseId]);

  return {
    course,
    selectedUnit,
    setSelectedUnit,
    loading,
    error,
    refreshCourse
  };
};
