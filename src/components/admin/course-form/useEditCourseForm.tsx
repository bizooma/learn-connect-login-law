import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { CourseFormData, ModuleData, LessonData, UnitData } from "./types";
import { useCourseForm } from "./hooks/useCourseForm";
import { useCourseContentManagement } from "./hooks/useCourseContentManagement";
import { updateCourseBasicInfo } from "./services/courseUpdateService";
import { cleanupExistingCourseContent } from "./services/courseContentCleanup";
import { createLessonsAndUnits } from "./services/sectionCreation";
import { createWelcomeCalendarEvent } from "./services/calendarService";
import { supabase } from "@/integrations/supabase/client";
import { createCourseWithModules } from "./services/courseSubmissionService";

type Course = Tables<'courses'>;

const ensureCalendarExists = async (courseId: string) => {
  try {
    await createWelcomeCalendarEvent(courseId, 'Course Updated');
  } catch (error) {
    console.error('Error ensuring calendar exists:', error);
  }
};

const fetchExistingModules = async (courseId: string): Promise<ModuleData[]> => {
  try {
    console.log('Fetching existing modules for course:', courseId);
    
    const { data: modulesData, error: modulesError } = await supabase
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

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return [];
    }

    console.log('Modules data fetched:', modulesData);

    // Transform the data to match our ModuleData interface
    const modules: ModuleData[] = modulesData?.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description || '',
      image_url: module.image_url || '',
      file_url: module.file_url || '',
      file_name: module.file_name || '',
      file_size: module.file_size || 0,
      sort_order: module.sort_order,
      lessons: module.lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        image_url: lesson.image_url || '',
        file_url: lesson.file_url || '',
        file_name: lesson.file_name || '',
        file_size: lesson.file_size || 0,
        sort_order: lesson.sort_order,
        units: lesson.units?.map(unit => ({
          id: unit.id,
          title: unit.title,
          description: unit.description || '',
          content: unit.content || '',
          video_url: unit.video_url || '',
          video_type: (unit.video_url?.includes('youtube.com') || unit.video_url?.includes('youtu.be')) ? 'youtube' as const : 'upload' as const,
          duration_minutes: unit.duration_minutes || 0,
          sort_order: unit.sort_order,
          quiz_id: undefined,
          image_url: '',
          file_url: unit.file_url || '',
          file_name: unit.file_name || '',
          file_size: unit.file_size || 0,
        } as UnitData)).sort((a, b) => a.sort_order - b.sort_order) || []
      } as LessonData)).sort((a, b) => a.sort_order - b.sort_order) || []
    } as ModuleData)) || [];

    return modules;
  } catch (error) {
    console.error('Error fetching existing modules:', error);
    return [];
  }
};

export const useEditCourseForm = (course: Course | null, open: boolean, onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const { toast } = useToast();
  
  const form = useCourseForm(course, open);

  // Load existing modules when the form opens
  useEffect(() => {
    if (course && open) {
      console.log('Loading existing modules for course:', course.id);
      fetchExistingModules(course.id).then(existingModules => {
        console.log('Setting modules:', existingModules);
        setModules(existingModules);
      });
    } else {
      setModules([]);
    }
  }, [course, open]);

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      await updateCourseBasicInfo(course, data);
      await ensureCalendarExists(course.id);
      await cleanupExistingCourseContent(course.id);

      // Use the new module-aware submission
      if (modules.length > 0) {
        await createCourseWithModules(course.id, data, modules);
      }

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    modules,
    setModules,
    onSubmit,
  };
};
