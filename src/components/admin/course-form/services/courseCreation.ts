
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";

export const createCourse = async (data: CourseFormData) => {
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

  // Create the course
  const courseData = {
    title: data.title,
    description: data.description,
    instructor: data.instructor,
    category: data.category,
    level: data.level || 'beginner',
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
  return courseDataResult;
};
