
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "../types";
import { uploadImageFile } from "../fileUploadUtils";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;

export const updateCourseBasicInfo = async (course: Course, data: CourseFormData) => {
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
};
