
import { supabase } from "@/integrations/supabase/client";
import { ModuleData, LessonData, UnitData } from "../types";
import { updateUnit, createUnit } from "./unitService";
import { createLesson } from "./sectionService";

interface ExistingModule {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  lessons: ExistingLesson[];
}

interface ExistingLesson {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  units: ExistingUnit[];
}

interface ExistingUnit {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  file_url: string;
  file_name: string;
  file_size: number;
  files: any;
  sort_order: number;
}

export const performSelectiveUpdate = async (courseId: string, newModules: ModuleData[]) => {
  console.log('Starting selective update for course:', courseId);
  
  // Fetch existing course structure
  const { data: existingModules, error: fetchError } = await supabase
    .from('modules')
    .select(`
      *,
      lessons:lessons(
        *,
        units:units(*)
      )
    `)
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  if (fetchError) {
    console.error('Error fetching existing modules:', fetchError);
    throw fetchError;
  }

  console.log('Existing modules:', existingModules);
  console.log('New modules structure:', newModules);

  // Process each module in the new structure
  for (let moduleIndex = 0; moduleIndex < newModules.length; moduleIndex++) {
    const newModule = newModules[moduleIndex];
    const existingModule = existingModules?.[moduleIndex];

    // Update module sort order if it changed
    if (existingModule && existingModule.sort_order !== moduleIndex) {
      await supabase
        .from('modules')
        .update({ sort_order: moduleIndex })
        .eq('id', existingModule.id);
    }

    // Process lessons within each module
    if (newModule.lessons && existingModule?.lessons) {
      for (let lessonIndex = 0; lessonIndex < newModule.lessons.length; lessonIndex++) {
        const newLesson = newModule.lessons[lessonIndex];
        const existingLesson = existingModule.lessons[lessonIndex];

        // Update lesson sort order if it changed
        if (existingLesson && existingLesson.sort_order !== lessonIndex) {
          await supabase
            .from('lessons')
            .update({ sort_order: lessonIndex })
            .eq('id', existingLesson.id);
        }

        // Process units within each lesson
        if (newLesson.units && existingLesson?.units) {
          for (let unitIndex = 0; unitIndex < newLesson.units.length; unitIndex++) {
            const newUnit = newLesson.units[unitIndex];
            const existingUnit = existingLesson.units[unitIndex];

            if (existingUnit) {
              // Check if unit content has changed
              const hasContentChanged = (
                newUnit.title !== existingUnit.title ||
                newUnit.description !== existingUnit.description ||
                newUnit.content !== existingUnit.content ||
                newUnit.video_url !== existingUnit.video_url ||
                JSON.stringify(newUnit.files) !== JSON.stringify(existingUnit.files) ||
                newUnit.sort_order !== unitIndex
              );

              if (hasContentChanged) {
                console.log('Updating unit:', newUnit.title);
                await updateUnit(existingUnit.id, {
                  ...newUnit,
                  sort_order: unitIndex
                });
              } else if (existingUnit.sort_order !== unitIndex) {
                // Just update sort order if only position changed
                await supabase
                  .from('units')
                  .update({ sort_order: unitIndex })
                  .eq('id', existingUnit.id);
              }
            } else {
              // New unit - create it
              console.log('Creating new unit:', newUnit.title);
              await createUnit(existingLesson.id, {
                ...newUnit,
                sort_order: unitIndex
              });
            }
          }

          // Remove any extra units that no longer exist
          if (existingLesson.units.length > newLesson.units.length) {
            const unitsToDelete = existingLesson.units.slice(newLesson.units.length);
            for (const unit of unitsToDelete) {
              await supabase
                .from('units')
                .delete()
                .eq('id', unit.id);
            }
          }
        }
      }

      // Handle new lessons that were added
      if (newModule.lessons.length > existingModule.lessons.length) {
        const newLessons = newModule.lessons.slice(existingModule.lessons.length);
        for (let i = 0; i < newLessons.length; i++) {
          const newLesson = newLessons[i];
          const lessonIndex = existingModule.lessons.length + i;
          
          console.log('Creating new lesson:', newLesson.title);
          const createdLesson = await createLesson(courseId, existingModule.id, {
            ...newLesson,
            sort_order: lessonIndex
          });

          // Create units for the new lesson
          for (let unitIndex = 0; unitIndex < newLesson.units.length; unitIndex++) {
            const unit = newLesson.units[unitIndex];
            await createUnit(createdLesson.id, {
              ...unit,
              sort_order: unitIndex
            });
          }
        }
      }

      // Remove any extra lessons that no longer exist
      if (existingModule.lessons.length > newModule.lessons.length) {
        const lessonsToDelete = existingModule.lessons.slice(newModule.lessons.length);
        for (const lesson of lessonsToDelete) {
          // Delete units first
          await supabase
            .from('units')
            .delete()
            .in('section_id', [lesson.id]);
          
          // Then delete lesson
          await supabase
            .from('lessons')
            .delete()
            .eq('id', lesson.id);
        }
      }
    }
  }

  console.log('Selective update completed successfully');
};

export const shouldUseSelectiveUpdate = (modules: ModuleData[]): boolean => {
  // Use selective update if we have existing modules with IDs
  // This indicates we're editing existing content rather than creating new
  return modules.some(module => 
    module.id && module.lessons.some(lesson => 
      lesson.id && lesson.units.some(unit => unit.id)
    )
  );
};
