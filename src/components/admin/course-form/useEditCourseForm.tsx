
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { CourseFormData } from "./types";
import { useCourseForm } from "./hooks/useCourseForm";
import { useCourseContentManagement } from "./hooks/useCourseContentManagement";
import { updateCourseBasicInfo } from "./services/courseUpdateService";
import { cleanupExistingCourseContent } from "./services/courseContentCleanup";
import { createLessonsAndUnits } from "./services/sectionCreation";
import { createWelcomeCalendarEvent } from "./services/calendarService";

type Course = Tables<'courses'>;

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
}

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
}

const ensureCalendarExists = async (courseId: string) => {
  try {
    await createWelcomeCalendarEvent(courseId, 'Course Updated');
  } catch (error) {
    console.error('Error ensuring calendar exists:', error);
  }
};

export const useEditCourseForm = (course: Course | null, open: boolean, onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const { toast } = useToast();
  
  const form = useCourseForm(course, open);

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      await updateCourseBasicInfo(course, data);
      await ensureCalendarExists(course.id);
      await cleanupExistingCourseContent(course.id);

      // Convert modules structure to sections structure for backward compatibility
      const sections = modules.flatMap(module => 
        module.lessons.map(lesson => ({
          ...lesson,
          units: lesson.units
        }))
      );

      if (sections.length > 0) {
        await createLessonsAndUnits(course.id, sections);
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
