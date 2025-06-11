
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
    title: courseData.title || course.title,
    description: courseData.description || course.description,
    instructor: courseData.instructor || course.instructor,
    category: courseData.category || course.category,
    level: courseData.level || course.level,
    duration: courseData.duration || course.duration,
    updated_at: new Date().toISOString(),
  };

  // Only update image if a new one was uploaded
  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  // Ensure no empty values that would violate constraints
  if (!updateData.title || updateData.title.trim() === '') {
    updateData.title = course.title;
  }
  if (!updateData.instructor || updateData.instructor.trim() === '') {
    updateData.instructor = course.instructor;
  }
  if (!updateData.category || updateData.category.trim() === '') {
    updateData.category = course.category;
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

  // First, get the existing course to preserve current values
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (fetchError) {
    console.error('Error fetching existing course:', fetchError);
    throw new Error(`Failed to fetch existing course: ${fetchError.message}`);
  }

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
    title: courseData.title || existingCourse.title,
    description: courseData.description || existingCourse.description,
    instructor: courseData.instructor || existingCourse.instructor,
    category: courseData.category || existingCourse.category,
    level: courseData.level || existingCourse.level,
    duration: courseData.duration || existingCourse.duration,
    is_draft: isDraft,
    updated_at: new Date().toISOString(),
  };

  // Only update image if a new one was uploaded
  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  // Ensure no empty values that would violate constraints
  if (!updateData.title || updateData.title.trim() === '') {
    updateData.title = existingCourse.title;
  }
  if (!updateData.instructor || updateData.instructor.trim() === '') {
    updateData.instructor = existingCourse.instructor;
  }
  if (!updateData.category || updateData.category.trim() === '') {
    updateData.category = existingCourse.category;
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
