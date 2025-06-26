import { supabase } from "@/integrations/supabase/client";
import { CourseFormData } from "./types";
import { uploadImageFile } from "./fileUploadUtils";
import { createDefaultModule } from "./services/moduleCreation";
import { createLessonsAndUnits } from "./services/sectionCreation";
import { createWelcomeCalendarEvent } from "./services/calendarService";
import { createCourseWithModules } from "./services/courseSubmissionService";
import { sanitizeForDatabase } from "@/utils/databaseSanitization";

interface SectionData {
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: any[];
}

interface ModuleData {
  title: string;
  description: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  sort_order: number;
  lessons: any[];
}

export const handleCourseSubmission = async (
  data: CourseFormData, 
  sections: SectionData[], 
  modules?: ModuleData[]
) => {
  console.log('Starting course submission with data:', { data, sections, modules });
  
  let imageUrl = '';
  
  // Upload course image if provided
  if (data.image_file) {
    try {
      imageUrl = await uploadImageFile(data.image_file);
    } catch (error) {
      console.error('Image upload failed:', error);
      // Continue without image
    }
  }

  // Prepare course data with proper null handling for optional fields
  const courseData = sanitizeForDatabase({
    title: data.title, // Required field
    description: data.description,
    instructor: data.instructor,
    category: data.category,
    level: data.level,
    duration: data.duration,
    image_url: imageUrl || null,
    is_draft: false,
  }, ['title']); // Only title is truly required

  console.log('Prepared course data:', courseData);

  // Create the course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (courseError) {
    console.error('Error creating course:', courseError);
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  console.log('Course created:', course);

  // Create welcome calendar event
  try {
    await createWelcomeCalendarEvent(course.id, course.title);
  } catch (error) {
    console.error('Error creating welcome calendar event:', error);
  }

  // Handle content creation based on whether we have modules or sections
  if (modules && modules.length > 0) {
    console.log('Creating course with modules structure');
    await createCourseWithModules(course.id, data, modules);
  } else if (sections && sections.length > 0) {
    console.log('Creating course with legacy sections structure');
    // Create a default module for backward compatibility
    const defaultModule = await createDefaultModule(course.id);
    await createLessonsAndUnits(course.id, sections, defaultModule.id);
  } else {
    console.log('No content provided, creating empty course');
  }

  return course;
};
