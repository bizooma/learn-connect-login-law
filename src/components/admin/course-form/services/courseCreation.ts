
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
// Removed automatic calendar event import

export const createCourse = async (courseData: CourseFormData, isDraft: boolean = false) => {
  console.log('Creating course with data:', courseData);

  let imageUrl = '';
  
  if (courseData.image_file) {
    try {
      console.log('Uploading course image...');
      imageUrl = await uploadImageFile(courseData.image_file);
      console.log('Course image uploaded:', imageUrl);
    } catch (error) {
      console.error('Error uploading course image:', error);
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
    console.error('Error creating course:', courseError);
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  console.log('Course created successfully:', course);

  // Removed automatic calendar event creation
  // No welcome calendar events will be created automatically

  return course;
};
