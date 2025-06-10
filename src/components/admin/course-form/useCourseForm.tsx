
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData } from "./types";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

export const useCourseForm = (course?: Course | null, open?: boolean) => {
  const { toast } = useToast();
  
  const form = useForm<CourseFormData>({
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      instructor: course?.instructor || "",
      category: course?.category || "",
      level: course?.level || "",
      duration: course?.duration || "",
      image_url: course?.image_url || "",
      image_file: undefined,
    },
  });

  // Reset form when course changes or dialog opens
  useState(() => {
    if (course && open) {
      form.reset({
        title: course.title || "",
        description: course.description || "",
        instructor: course.instructor || "",
        category: course.category || "",
        level: course.level || "",
        duration: course.duration || "",
        image_url: course.image_url || "",
        image_file: undefined,
      });
    }
  });

  return form;
};
