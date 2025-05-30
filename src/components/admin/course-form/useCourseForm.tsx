
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_url?: string;
}

interface SectionData {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  sort_order: number;
}

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
      image_url: "",
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      // Create the course first
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([{
          title: data.title,
          description: data.description,
          instructor: data.instructor,
          category: data.category,
          level: data.level,
          duration: data.duration,
          image_url: data.image_url || null,
          rating: 0,
          students_enrolled: 0,
        }])
        .select()
        .single();

      if (courseError) throw courseError;

      // Create sections and units if any
      if (sections.length > 0) {
        for (const section of sections) {
          const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([{
              course_id: courseData.id,
              title: section.title,
              description: section.description,
              sort_order: section.sort_order,
            }])
            .select()
            .single();

          if (sectionError) throw sectionError;

          // Create units for this section
          if (section.units.length > 0) {
            const unitsToInsert = section.units.map(unit => ({
              section_id: sectionData.id,
              title: unit.title,
              description: unit.description,
              content: unit.content,
              video_url: unit.video_url || null,
              duration_minutes: unit.duration_minutes,
              sort_order: unit.sort_order,
            }));

            const { error: unitsError } = await supabase
              .from('units')
              .insert(unitsToInsert);

            if (unitsError) throw unitsError;
          }
        }
      }

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
