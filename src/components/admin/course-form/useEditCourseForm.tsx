import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Unit = Tables<'units'>;

interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_file?: File;
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
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
}

export const useEditCourseForm = (course: Course | null, open: boolean, onSuccess: () => void) => {
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

  // Determine video type based on URL
  const getVideoType = (url: string): 'youtube' | 'upload' => {
    if (!url) return 'youtube';
    return url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'upload';
  };

  // Fetch course sections and units when course changes
  useEffect(() => {
    const fetchCourseSections = async () => {
      if (!course?.id) return;

      try {
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select(`
            *,
            units:units(*)
          `)
          .eq('course_id', course.id)
          .order('sort_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        const formattedSections: SectionData[] = sectionsData?.map(section => ({
          id: section.id,
          title: section.title,
          description: section.description || "",
          sort_order: section.sort_order,
          units: (section.units as Unit[])?.map(unit => ({
            id: unit.id,
            title: unit.title,
            description: unit.description || "",
            content: unit.content || "",
            video_url: unit.video_url || "",
            video_type: getVideoType(unit.video_url || ""),
            duration_minutes: unit.duration_minutes || 0,
            sort_order: unit.sort_order,
          })).sort((a, b) => a.sort_order - b.sort_order) || []
        })).sort((a, b) => a.sort_order - b.sort_order) || [];

        setSections(formattedSections);
      } catch (error) {
        console.error('Error fetching course sections:', error);
      }
    };

    if (course && open) {
      form.reset({
        title: course.title,
        description: course.description || "",
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        duration: course.duration,
        image_file: undefined, // Don't pre-populate file input
      });
      fetchCourseSections();
    }
  }, [course, open, form]);

  const uploadImageFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `course-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadVideoFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `course-videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = course.image_url; // Keep existing image by default
      
      // Upload new image file if provided
      if (data.image_file) {
        try {
          imageUrl = await uploadImageFile(data.image_file);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Keep existing image if upload fails
        }
      }

      // Update the course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: data.title,
          description: data.description,
          instructor: data.instructor,
          category: data.category,
          level: data.level,
          duration: data.duration,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Delete existing sections and units (CASCADE will handle units)
      const { error: deleteError } = await supabase
        .from('sections')
        .delete()
        .eq('course_id', course.id);

      if (deleteError) throw deleteError;

      // Create new sections and units
      if (sections.length > 0) {
        for (const section of sections) {
          const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([{
              course_id: course.id,
              title: section.title,
              description: section.description,
              sort_order: section.sort_order,
            }])
            .select()
            .single();

          if (sectionError) throw sectionError;

          // Create units for this section
          if (section.units.length > 0) {
            const unitsToInsert = await Promise.all(
              section.units.map(async (unit) => {
                let videoUrl = unit.video_url;
                
                // Upload video file if it's an upload type and has a file
                if (unit.video_type === 'upload' && unit.video_file) {
                  try {
                    videoUrl = await uploadVideoFile(unit.video_file);
                  } catch (error) {
                    console.error('Error uploading video:', error);
                    // Keep the original URL if upload fails
                  }
                }

                return {
                  section_id: sectionData.id,
                  title: unit.title,
                  description: unit.description,
                  content: unit.content,
                  video_url: videoUrl || null,
                  duration_minutes: unit.duration_minutes,
                  sort_order: unit.sort_order,
                };
              })
            );

            const { error: unitsError } = await supabase
              .from('units')
              .insert(unitsToInsert);

            if (unitsError) throw unitsError;
          }
        }
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
    sections,
    setSections,
    onSubmit,
  };
};
