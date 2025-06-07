
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

export const updateCourseBasicInfo = async (
  course: Course,
  courseData: CourseFormData
) => {
  console.log('Updating course basic info for:', course.id, 'Data:', courseData);

  let imageUrl = '';
  
  if (courseData.image_file) {
    try {
      console.log('Uploading new course image...');
      imageUrl = await uploadImageFile(courseData.image_file);
      console.log('Course image uploaded:', imageUrl);
    } catch (error) {
      console.error('Error uploading course image:', error);
      throw new Error(`Failed to upload course image: ${error.message}`);
    }
  }

  const updateData: any = {
    title: courseData.title,
    description: courseData.description,
    instructor: courseData.instructor,
    category: courseData.category,
    level: courseData.level,
    duration: courseData.duration,
    updated_at: new Date().toISOString(),
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  const { data: updatedCourse, error: courseError } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', course.id)
    .select()
    .single();

  if (courseError) {
    console.error('Error updating course:', courseError);
    throw new Error(`Failed to update course: ${courseError.message}`);
  }

  console.log('Course basic info updated successfully:', updatedCourse);
  return updatedCourse;
};

export const updateCourse = async (
  courseId: string, 
  courseData: CourseFormData, 
  isDraft: boolean = false
) => {
  console.log('Updating course with ID:', courseId, 'Data:', courseData);

  let imageUrl = '';
  
  if (courseData.image_file) {
    try {
      console.log('Uploading new course image...');
      imageUrl = await uploadImageFile(courseData.image_file);
      console.log('Course image uploaded:', imageUrl);
    } catch (error) {
      console.error('Error uploading course image:', error);
      throw new Error(`Failed to upload course image: ${error.message}`);
    }
  }

  const updateData: any = {
    title: courseData.title,
    description: courseData.description,
    instructor: courseData.instructor,
    category: courseData.category,
    level: courseData.level,
    duration: courseData.duration,
    is_draft: isDraft,
    updated_at: new Date().toISOString(),
  };

  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', courseId)
    .select()
    .single();

  if (courseError) {
    console.error('Error updating course:', courseError);
    throw new Error(`Failed to update course: ${courseError.message}`);
  }

  console.log('Course updated successfully:', course);

  // Removed automatic calendar event creation
  // No calendar events will be created automatically during updates

  return course;
};
