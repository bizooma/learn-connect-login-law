
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CourseFormData, SectionData } from "./types";
import { handleCourseSubmission } from "./courseSubmissionHandler";

export const useCourseForm = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sections, setSections] = useState<SectionData[]>([]);
  const { toast } = useToast();
  
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

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await handleCourseSubmission(data, sections);

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      form.reset();
      setSections([]);
      onSuccess();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    sections,
    setSections,
    onSubmit,
  };
};
