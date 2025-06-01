
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { SectionData, CourseFormData } from "./types";
import { useCourseForm } from "./hooks/useCourseForm";
import { useCourseContentManagement } from "./hooks/useCourseContentManagement";
import { updateCourseBasicInfo } from "./services/courseUpdateService";
import { cleanupExistingCourseContent } from "./services/courseContentCleanup";
import { createLessonsAndUnits } from "./services/sectionCreation";
import { createWelcomeCalendarEvent } from "./services/calendarService";

type Course = Tables<'courses'>;

const ensureCalendarExists = async (courseId: string) => {
  try {
    await createWelcomeCalendarEvent(courseId, 'Course Updated');
  } catch (error) {
    console.error('Error ensuring calendar exists:', error);
  }
};

export const useEditCourseForm = (course: Course | null, open: boolean, onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useCourseForm(course, open);
  const { lessons, setLessons } = useCourseContentManagement(course, open);

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      await updateCourseBasicInfo(course, data);
      await ensureCalendarExists(course.id);
      await cleanupExistingCourseContent(course.id);

      if (lessons.length > 0) {
        await createLessonsAndUnits(course.id, lessons);
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
    lessons,
    setLessons,
    onSubmit,
  };
};
