
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
      console.log('Starting image upload...');
      imageUrl = await uploadImageFile(data.image_file);
      console.log('Image upload completed:', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
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

  console.log('Creating course with data:', courseData);

  const { data: courseDataResult, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (courseError) {
    console.error('Error creating course:', courseError);
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  console.log('Course created successfully:', courseDataResult);

  // Create sections and units if any
  if (sections.length > 0) {
    for (const section of sections) {
      console.log('Creating section:', section.title);
      
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

      if (sectionError) {
        console.error('Error creating section:', sectionError);
        throw new Error(`Failed to create section: ${sectionError.message}`);
      }

      // Create units for this section
      if (section.units.length > 0) {
        const unitsToInsert = await Promise.all(
          section.units.map(async (unit) => {
            let videoUrl = unit.video_url;
            
            // Upload video file if it's an upload type and has a file
            if (unit.video_type === 'upload' && unit.video_file) {
              try {
                console.log('Uploading video for unit:', unit.title);
                videoUrl = await uploadVideoFile(unit.video_file);
              } catch (error) {
                console.error('Error uploading video:', error);
                throw new Error(`Failed to upload video for unit "${unit.title}": ${error.message}`);
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

        if (unitsError) {
          console.error('Error creating units:', unitsError);
          throw new Error(`Failed to create units: ${unitsError.message}`);
        }
      }
    }
  }

  console.log('Course creation completed successfully');
};
