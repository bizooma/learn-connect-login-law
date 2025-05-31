import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, SectionData } from "./types";
import { uploadImageFile, uploadVideoFile } from "./fileUploadUtils";

export const handleCourseSubmission = async (
  data: CourseFormData,
  sections: SectionData[]
) => {
  let imageUrl = null;
  
  // Upload image file if provided
  if (data.image_file) {
    try {
      imageUrl = await uploadImageFile(data.image_file);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Continue without image if upload fails
    }
  }

  // Create the course first
  const courseData = {
    title: data.title,
    description: data.description,
    instructor: data.instructor,
    category: data.category,
    level: data.level || 'beginner', // Ensure level is always provided
    duration: data.duration,
    image_url: imageUrl,
    rating: 0,
    students_enrolled: 0,
  };

  const { data: courseDataResult, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (courseError) throw courseError;

  // Create sections and units if any
  if (sections.length > 0) {
    for (const section of sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .insert({
          course_id: courseDataResult.id,
          title: section.title,
          description: section.description,
          sort_order: section.sort_order,
        })
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
};
