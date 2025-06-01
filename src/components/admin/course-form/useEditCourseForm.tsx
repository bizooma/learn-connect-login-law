
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { uploadImageFile, uploadVideoFile } from "./fileUploadUtils";

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
          image_url: section.image_url || "",
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
        image_file: undefined,
      });
      fetchCourseSections();
    }
  }, [course, open, form]);

  const ensureCalendarExists = async (courseId: string) => {
    try {
      // Check if course already has calendar events
      const { data: existingEvents } = await supabase
        .from('course_calendars')
        .select('id')
        .eq('course_id', courseId)
        .limit(1);

      // If no events exist, create a default one
      if (!existingEvents || existingEvents.length === 0) {
        const currentDate = new Date();
        const welcomeDate = new Date(currentDate);
        welcomeDate.setDate(currentDate.getDate() + 1);

        await supabase
          .from('course_calendars')
          .insert({
            course_id: courseId,
            title: `Course Updated`,
            description: 'Course has been updated with new content',
            event_date: welcomeDate.toISOString().split('T')[0],
            event_type: 'general',
          });

        console.log('Default calendar event created for updated course');
      }
    } catch (error) {
      console.error('Error ensuring calendar exists:', error);
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = course.image_url;
      
      if (data.image_file) {
        try {
          imageUrl = await uploadImageFile(data.image_file);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }

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

      await ensureCalendarExists(course.id);

      // Delete existing sections and units to ensure clean update
      const { error: deleteUnitsError } = await supabase
        .from('units')
        .delete()
        .in('section_id', 
          await supabase
            .from('sections')
            .select('id')
            .eq('course_id', course.id)
            .then(({ data }) => data?.map(s => s.id) || [])
        );

      if (deleteUnitsError) console.error('Error deleting units:', deleteUnitsError);

      const { error: deleteError } = await supabase
        .from('sections')
        .delete()
        .eq('course_id', course.id);

      if (deleteError) throw deleteError;

      if (sections.length > 0) {
        for (const section of sections) {
          console.log('Processing section:', section.title);
          
          const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([{
              course_id: course.id,
              title: section.title,
              description: section.description,
              image_url: section.image_url || null,
              sort_order: section.sort_order,
            }])
            .select()
            .single();

          if (sectionError) throw sectionError;

          if (section.units.length > 0) {
            console.log('Processing units for section:', section.title);
            
            const unitsToInsert = await Promise.all(
              section.units.map(async (unit) => {
                let videoUrl = unit.video_url;
                
                console.log('Processing unit:', unit.title, 'Video type:', unit.video_type, 'Has video_file:', !!unit.video_file);
                
                // Handle video file upload for upload type units
                if (unit.video_type === 'upload' && unit.video_file instanceof File) {
                  try {
                    console.log('Uploading video file for unit:', unit.title);
                    videoUrl = await uploadVideoFile(unit.video_file);
                    console.log('Video uploaded successfully:', videoUrl);
                  } catch (error) {
                    console.error('Error uploading video for unit:', unit.title, error);
                    // Don't throw here, just log the error and continue with existing URL
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

            console.log('Inserting units:', unitsToInsert);

            const { error: unitsError } = await supabase
              .from('units')
              .insert(unitsToInsert);

            if (unitsError) {
              console.error('Error inserting units:', unitsError);
              throw unitsError;
            }

            console.log('Units inserted successfully for section:', section.title);
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
