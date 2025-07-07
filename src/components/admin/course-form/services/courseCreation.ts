
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { logger } from "@/utils/logger";
// Removed automatic calendar event import

export const createCourse = async (courseData: CourseFormData, isDraft: boolean = false) => {
  logger.log('Creating course with data:', courseData);

  let imageUrl = '';
  
  if (courseData.image_file) {
    try {
      logger.log('Uploading course image...');
      imageUrl = await uploadImageFile(courseData.image_file);
      logger.log('Course image uploaded:', imageUrl);
    } catch (error) {
      logger.error('Error uploading course image:', error);
      throw new Error(`Failed to upload course image: ${error.message}`);
    }
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      title: courseData.title,
      description: courseData.description,
      instructor: courseData.instructor,
      category: courseData.category,
      level: courseData.level,
      duration: courseData.duration,
      image_url: imageUrl || null,
      is_draft: isDraft,
    })
    .select()
    .single();

  if (courseError) {
    logger.error('Error creating course:', courseError);
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  logger.log('Course created successfully:', course);

  // Removed automatic calendar event creation
  // No welcome calendar events will be created automatically

  return course;
};
