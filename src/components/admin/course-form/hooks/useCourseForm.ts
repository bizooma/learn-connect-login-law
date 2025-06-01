
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_file?: File;
}

export const useCourseForm = (course: Course | null, open: boolean) => {
  const form = useForm<CourseFormData>({
    defaultValues: {
      title: "",
      description: "",
      instructor: "",
      category: "",
      level: "",
      duration: "",
      image_file: undefined,
    },
  });

  useEffect(() => {
    if (course && open) {
      form.reset({
        title: course.title,
        description: course.description || "",
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        duration: course.duration,
        image_file: undefined,
      });
    }
  }, [course, open, form]);

  return form;
};
