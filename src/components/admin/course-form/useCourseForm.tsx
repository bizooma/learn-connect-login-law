
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
      image_file: null,
      tags: course?.tags || [],
      is_draft: course?.is_draft || false,
      students_enrolled: course?.students_enrolled || 0,
      rating: course?.rating || 0,
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
        image_file: null,
        tags: course.tags || [],
        is_draft: course.is_draft || false,
        students_enrolled: course.students_enrolled || 0,
        rating: course.rating || 0,
      });
    }
  });

  return form;
};
